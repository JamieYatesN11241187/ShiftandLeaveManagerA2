const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const LeaveRequest = require('../models/LeaveRequests');
const {
  createLeaveRequest,
  getLeaveRequests,
  updateLeaveRequest,
  deleteLeaveRequest,
} = require('../controllers/leaveController'); 

const { expect } = chai;

describe('Leave Request Controller', () => {
  afterEach(() => sinon.restore()); // Reset stubs after each test

  describe('createLeaveRequest', () => {
    it('should create a leave request for an authenticated user', async () => {
      const req = {
        user: { name: 'Alice Johnson' },
        body: {
          start: new Date('2025-08-11T08:00:00Z'),
          end: new Date('2025-08-11T16:00:00Z'),
        },
      };

      // Stub the save method of the Mongoose model
      const saveStub = sinon.stub(LeaveRequest.prototype, 'save').resolvesThis();

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await createLeaveRequest(req, res);

      expect(saveStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;

      const doc = res.json.firstCall.args[0];
      expect(doc).to.include({
        person: req.user.name,
        status: 'pending',
      });
      expect(new Date(doc.start).toISOString()).to.equal(req.body.start.toISOString());
      expect(new Date(doc.end).toISOString()).to.equal(req.body.end.toISOString());
    });

    it('should return 400 if user not authenticated', async () => {
      const req = {}; // no user object
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await createLeaveRequest(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'User not authenticated' })).to.be.true;
    });

    it('should return 500 on save error', async () => {
      sinon.stub(LeaveRequest.prototype, 'save').throws(new Error('DB Error'));

      const req = {
        user: { name: 'Bob' },
        body: {
          start: new Date('2025-09-01T09:00:00Z'),
          end: new Date('2025-09-03T17:00:00Z'),
        },
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await createLeaveRequest(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({
        message: 'Failed to create leave request.',
        error: 'DB Error',
      })).to.be.true;
    });
  });

  describe('getLeaveRequests', () => {
    it('should return all leave requests', async () => {
      const requests = [
        { _id: new mongoose.Types.ObjectId(), person: 'A', status: 'pending' },
        { _id: new mongoose.Types.ObjectId(), person: 'B', status: 'approved' },
      ];

      const findStub = sinon.stub(LeaveRequest, 'find').resolves(requests);

      const req = {};
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await getLeaveRequests(req, res);

      expect(findStub.calledOnce).to.be.true;
      expect(res.json.calledWith(requests)).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should return 500 on error', async () => {
      sinon.stub(LeaveRequest, 'find').throws(new Error('DB Error'));

      const req = {};
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await getLeaveRequests(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({
        message: 'Failed to fetch leave requests',
        error: 'DB Error',
      })).to.be.true;
    });
  });

  describe('updateLeaveRequest', () => {
    it('manager can update status only', async () => {
      const id = new mongoose.Types.ObjectId().toString();

      const existing = {
        _id: id,
        person: 'Alice',
        start: new Date('2025-10-01T09:00:00Z'),
        end: new Date('2025-10-02T17:00:00Z'),
        status: 'pending',
        save: sinon.stub().resolvesThis(),
      };

      const findByIdStub = sinon.stub(LeaveRequest, 'findById').resolves(existing);

      const req = {
        params: { id },
        user: { role: 'manager', name: 'Manager Mike' },
        body: { status: 'approved', person: 'SHOULD_NOT_APPLY' },
      };

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await updateLeaveRequest(req, res);

      expect(findByIdStub.calledOnceWith(id)).to.be.true;
      expect(existing.status).to.equal('approved');
      expect(existing.person).to.equal('Alice'); // Ensure person is not overwritten
      expect(existing.save.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
      expect(res.json.calledOnce).to.be.true;
    });

    it('non-manager can update their own start/end (not status)', async () => {
      const id = new mongoose.Types.ObjectId().toString();

      const existing = {
        _id: id,
        person: 'Bob',
        start: new Date('2025-10-05T09:00:00Z'),
        end: new Date('2025-10-06T17:00:00Z'),
        status: 'pending',
        save: sinon.stub().resolvesThis(),
      };

      sinon.stub(LeaveRequest, 'findById').resolves(existing);

      const req = {
        params: { id },
        user: { role: 'employee', name: 'Bob' },
        body: {
          start: new Date('2025-10-07T09:00:00Z'),
          end: new Date('2025-10-08T17:00:00Z'),
          status: 'approved', // Should not be applied
        },
      };

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await updateLeaveRequest(req, res);

      expect(existing.start.toISOString()).to.equal(req.body.start.toISOString());
      expect(existing.end.toISOString()).to.equal(req.body.end.toISOString());
      expect(existing.status).to.equal('pending'); // Status should remain unchanged
      expect(res.json.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('non-manager cannot update someone else’s request (403)', async () => {
      const id = new mongoose.Types.ObjectId().toString();

      const existing = {
        _id: id,
        person: 'Alice',
        start: new Date('2025-10-05T09:00:00Z'),
        end: new Date('2025-10-06T17:00:00Z'),
        status: 'pending',
        save: sinon.stub().resolvesThis(),
      };

      sinon.stub(LeaveRequest, 'findById').resolves(existing);

      const req = {
        params: { id },
        user: { role: 'employee', name: 'Bob' },
        body: { start: new Date('2025-10-09T09:00:00Z') },
      };

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await updateLeaveRequest(req, res);

      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'You can only update your own leave request.' })).to.be.true;
      expect(existing.save.called).to.be.false;
    });

    it('returns 404 if request not found', async () => {
      sinon.stub(LeaveRequest, 'findById').resolves(null);

      const req = { params: { id: new mongoose.Types.ObjectId().toString() }, user: { role: 'employee', name: 'Zoe' }, body: {} };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await updateLeaveRequest(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Request not found' })).to.be.true;
    });

    it('returns 500 on error', async () => {
      sinon.stub(LeaveRequest, 'findById').throws(new Error('DB Error'));

      const req = { params: { id: new mongoose.Types.ObjectId().toString() }, user: { role: 'employee', name: 'Liz' }, body: {} };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await updateLeaveRequest(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({
        message: 'Failed to update leave request',
        error: 'DB Error',
      })).to.be.true;
    });
  });

  describe('deleteLeaveRequest', () => {
    it('returns 401 when no user on request', async () => {
      const req = { params: { id: new mongoose.Types.ObjectId().toString() } }; // No user
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await deleteLeaveRequest(req, res);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ error: 'Unauthorized. No user found.' })).to.be.true;
    });

    it('returns 403 when user is a manager', async () => {
      const req = { params: { id: new mongoose.Types.ObjectId().toString() }, user: { role: 'manager', name: 'Boss' } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await deleteLeaveRequest(req, res);

      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ error: 'Managers are not allowed to delete leave requests.' })).to.be.true;
    });

    it('deletes own request successfully (non-manager)', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { params: { id }, user: { role: 'employee', name: 'Sam' } };

      const findByIdAndDeleteStub = sinon.stub(LeaveRequest, 'findByIdAndDelete').resolves({ _id: id });

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await deleteLeaveRequest(req, res);

      expect(findByIdAndDeleteStub.calledOnceWith(id)).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: 'Leave request deleted successfully.' })).to.be.true;
    });

    it('returns 404 if request not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { params: { id }, user: { role: 'employee', name: 'Sam' } };

      sinon.stub(LeaveRequest, 'findByIdAndDelete').resolves(null);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await deleteLeaveRequest(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'Leave request not found.' })).to.be.true;
    });

    it('returns 500 on delete error', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { params: { id }, user: { role: 'employee', name: 'Sam' } };

      sinon.stub(LeaveRequest, 'findByIdAndDelete').throws(new Error('DB Error'));

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await deleteLeaveRequest(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: 'Failed to delete leave request.' })).to.be.true;
    });
  });
});
