const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const OvertimeRequest = require('../models/OvertimeRequest');
const { createOvertimeRequest, updateOvertimeRequest, deleteOvertimeRequest, getOvertimeRequests } = require('../controllers/overtimeController');
const { expect } = chai;

describe('create OvertimeRequest', () => {
    afterEach(() => sinon.restore()); // Restore all stubs/spies after each test
    
    it('should create a overtime request for an authenticated user', async () => {
      const req = {
      body: {
        person: "Test1 Snape",
        shiftTimings : "2025-09-25T06:00:00.000Z - 2025-09-25T15:00:00.000Z",
         hoursRequested: 2,
        reason: "test reason",
        status: "pending"
        },
      };

      // Stub the save method of the Mongoose model
      const saveStub = sinon.stub(OvertimeRequest.prototype, 'save').resolvesThis();

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await createOvertimeRequest(req, res);

      expect(saveStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;

      const doc = res.json.firstCall.args[0];
      expect(doc).to.include({
        person: req.body.person,
        shiftTimings: req.body.shiftTimings,
        hoursRequested: req.body.hoursRequested,
        reason: req.body.reason,
        status: req.body.status,
      });

    });
    it('should return 500 if an error occurs', async () => {
      // Simulate error during save
        //const saveStub =  sinon.stub(OvertimeRequest.prototype, 'save').throws(new Error('DB Error'));
        const saveStub = sinon.stub(OvertimeRequest.prototype, 'save').throws(new Error('Simulated database error'));
        const req = {
            body: {
                person: "Test2 Snape",
                shiftTimings: "2025-09-25T06:00:00.000Z - 2025-09-25T15:00:00.000Z",
                hoursRequested: 3,
                reason: "test reason",
                status: "pending"
            },
        };

        const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
        };

        await createOvertimeRequest(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ message: 'Simulated database error' })).to.be.true;

        //expect(res.json.calledWithMatch({message: 'Failed to create overtime.',error: 'DB Error',})).to.be.true;
        saveStub.restore();
    });
});
  
  describe('Update Overtime Request Test', () => {
    afterEach(() => sinon.restore());
  
    it('should update Overtime successfully', async () => {
      const overtimeId = new mongoose.Types.ObjectId();

      // Mock an existing overtime document with a stubbed save
      const existingOvertime = {
        _id: overtimeId,
        person: "New Person",
        shiftTimings: "2025-09-25T06:00:00.000Z - 2025-09-25T15:00:00.000Z",
        hoursRequested: 3,
        reason: "test reason",
        status: "pending",
        save: sinon.stub().resolvesThis(),
      };
  
      // Stub findById to return mocked document
      const findByIdStub = sinon.stub(OvertimeRequest, 'findById').resolves(existingOvertime);
  
      const req = {
        params: { id: overtimeId },
        body: {
          person: "New Person",
          shiftTimings: "2025-09-25T06:00:00.000Z - 2025-09-25T15:00:00.000Z",
          hoursRequested: 3,
          reason: "test reason",
          status: "approved",
          comments: "Approved by manager",
        },
      };
  
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await updateOvertimeRequest(req, res);

      // Assertions
      expect(findByIdStub.calledOnceWith(overtimeId)).to.be.true;
      expect(res.status.called).to.be.false; // No error, so no status called
      expect(res.json.calledOnce).to.be.true;
    });

    it('should return 404 if overtime is not found', async () => {
      sinon.stub(OvertimeRequest, 'findById').resolves(null); // Simulate not found
  
      const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await updateOvertimeRequest(req, res);
      
      //console.log('Status called with:', res.status.firstCall.args[0]);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Overtime request not found' })).to.be.true;
    });
  
    it('should return 500 on error', async () => {
      // Simulate error in findById
      sinon.stub(OvertimeRequest, 'findById').throws(new Error('DB Error'));
  
      const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
      
      await updateOvertimeRequest(req, res);
      //console.log('JSON response was:', res.json.firstCall.args[0]);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({message: 'DB Error'})).to.be.true;
    });
  });
  
  describe('Get OvertimeRequest Function Test', () => {
    afterEach(() => sinon.restore());
  
    it('should return all overtimes', async () => {
      const overtimes = [
        {
          _id: new mongoose.Types.ObjectId(),
          person: "Test3 Smith",
          shiftTimings: "2025-09-25T06:00:00.000Z - 2025-09-25T15:00:00.000Z",
          hoursRequested: 4,
          reason: "updated reason",
          status: "approved",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          person: "Test4 Smith",
          shiftTimings: "2025-09-25T06:00:00.000Z - 2025-09-25T15:00:00.000Z",
          hoursRequested: 3,
          reason: "another reason",
          status: "pending",
        },
      ];

      const findStub = sinon.stub(OvertimeRequest, 'find').resolves(overtimes);

      const req = {};
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };
      

      await getOvertimeRequests(req, res);
      //console.log('JSON response was:', res.json.firstCall.args[0]);
      // Assertions
      expect(findStub.calledOnce).to.be.true;
      expect(res.json.calledWith(overtimes)).to.be.true;
      expect(res.status.called).to.be.false; // No errors
    });
  
    it('should return 500 on error', async () => {
      sinon.stub(OvertimeRequest, 'find').throws(new Error('DB Error'));
  
      const req = {};
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await getOvertimeRequests(req, res);
      //console.log('JSON response was:', res.json.firstCall.args[0]);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({message: 'DB Error',})).to.be.true;
    });
  });

  describe('Delete OvertimeRequest Function Test', () => {
    afterEach(() => sinon.restore());

    it('should delete an overtime request successfully', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      
      const req = { params: { id } };

      const findByIdAndDeleteStub = sinon.stub(OvertimeRequest, 'findByIdAndDelete').resolves({ _id: id });

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };

      await deleteOvertimeRequest(req, res);

      //console.log('JSON response was:', res.json.firstCall.args[0]);
      //console.log('Status called with:', res.status.firstCall.args[0]);

      expect(findByIdAndDeleteStub.calledOnceWith(id)).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: 'Overtime request removed' })).to.be.true;
    });

    it('should return 404 if overtime request is not found', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { params: { id } };

      sinon.stub(OvertimeRequest, 'findByIdAndDelete').resolves(null); // Simulate not found

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
  
      await deleteOvertimeRequest(req, res);
      //console.log('JSON response was:', res.json.firstCall.args[0]);
      //console.log('Status called with:', res.status.firstCall.args[0]);


      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Overtime request not found' })).to.be.true;
    });
  
    it('should return 500 if an error occurs', async () => {
      const id = new mongoose.Types.ObjectId().toString();
      const req = { params: { id } };

      sinon.stub(OvertimeRequest, 'findByIdAndDelete').throws(new Error('DB Error'));

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy(),
      };
  
      await deleteOvertimeRequest(req, res);
      //console.log('JSON response was:', res.json.firstCall.args[0]);
      //console.log('Status called with:', res.status.firstCall.args[0]);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({message: 'DB Error',})).to.be.true;
    });
  });
  