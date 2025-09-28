const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Shift = require('../models/Shift');
const { createShift, updateShift, deleteShift, getShifts } = require('../controllers/shiftController');
const { expect } = chai;

describe('Create Shift Function Test', () => {
  afterEach(() => sinon.restore()); // Restore all stubs/spies after each test

  it('should create a new shift successfully', async () => {
    // Mock request body
    const req = {
      body: {
        person: "Alice Johnson",
        start: new Date("2025-08-11T08:00:00Z"),
        end: new Date("2025-08-11T16:00:00Z"),
      },
    };

    // Stub Shift.prototype.save to simulate successful DB save
    const saveStub = sinon.stub(Shift.prototype, 'save').resolvesThis();

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    // Call controller
    await createShift(req, res);

    // Assertions
    expect(saveStub.calledOnce).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.firstCall.args[0]).to.include({
      person: req.body.person,
      start: req.body.start,
      end: req.body.end,
    });
  });

  it('Create fail if missing person parameter', async () => {
    // Mock request body
    const req = {
      body: {
        //person: "Alice Johnson",
        start: new Date("2025-08-11T08:00:00Z"),
        end: new Date("2025-08-11T16:00:00Z"),
      },
    };

    // Stub Shift.prototype.save to simulate successful DB save
    const saveStub = sinon.stub(Shift.prototype, 'save').resolvesThis();

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    // Call controller
    await createShift(req, res);

    // Assertions
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.firstCall.args[0]).to.include({
      message: 'Person field is required',
    });
  });
  
  it('should return 500 if an error occurs', async () => {
    // Simulate error during save
    sinon.stub(Shift.prototype, 'save').throws(new Error('DB Error'));

    const req = {
      body: {
        person: "Test2 Johnson",
        start: new Date("2026-08-11T08:00:00Z"),
        end: new Date("2026-09-11T16:00:00Z"),
      },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await createShift(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Failed to create shift.',
      error: 'DB Error',
    })).to.be.true;
  });
});

describe('Update Shift Function Test', () => {
  afterEach(() => sinon.restore());

  it('should update shift successfully', async () => {
    const shiftId = new mongoose.Types.ObjectId();

    // Mock an existing shift document with a stubbed save
    const existingShift = {
      _id: shiftId,
      person: "Alice Johnson",
      start: new Date("2025-08-11T08:00:00Z"),
      end: new Date("2025-08-11T16:00:00Z"),
      save: sinon.stub().resolvesThis(),
    };

    // Stub findById to return mocked document
    const findByIdStub = sinon.stub(Shift, 'findById').resolves(existingShift);

    const req = {
      params: { id: shiftId },
      body: {
        person: "New Person",
        start: new Date("2025-08-12T08:00:00Z"),
        end: new Date("2025-08-12T16:00:00Z"),
      },
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };

    await updateShift(req, res);

    // Assertions
    expect(findByIdStub.calledOnceWith(shiftId)).to.be.true;
    expect(existingShift.person).to.equal("New Person");
    expect(existingShift.start.toISOString()).to.equal(req.body.start.toISOString());
    expect(existingShift.end.toISOString()).to.equal(req.body.end.toISOString());
    expect(res.status.called).to.be.false; // No error, so no status called
    expect(res.json.calledOnce).to.be.true;
  });

  it('should return 404 if shift is not found', async () => {
    sinon.stub(Shift, 'findById').resolves(null); // Simulate not found

    const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await updateShift(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Shift not found' })).to.be.true;
  });

  it('should return 500 on error', async () => {
    // Simulate error in findById
    sinon.stub(Shift, 'findById').throws(new Error('DB Error'));

    const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await updateShift(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Failed to update shift',
      error: 'DB Error',
    })).to.be.true;
  });
});

describe('Get Shift Function Test', () => {
  afterEach(() => sinon.restore());

  it('should return all shifts', async () => {
    const shifts = [
      {
        _id: new mongoose.Types.ObjectId(),
        person: "Test3 Johnson",
        start: new Date("2025-08-11T08:00:00Z"),
        end: new Date("2025-08-11T16:00:00Z"),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        person: "Test4 Johnson",
        start: new Date("2025-08-11T08:00:00Z"),
        end: new Date("2025-08-11T16:00:00Z"),
      },
    ];

    const findStub = sinon.stub(Shift, 'find').resolves(shifts);

    const req = {};
    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };

    await getShifts(req, res);

    // Assertions
    expect(findStub.calledOnce).to.be.true;
    expect(res.json.calledWith(shifts)).to.be.true;
    expect(res.status.called).to.be.false; // No errors
  });

  it('should return 500 on error', async () => {
    sinon.stub(Shift, 'find').throws(new Error('DB Error'));

    const req = {};
    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };

    await getShifts(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Failed to fetch shifts',
      error: 'DB Error',
    })).to.be.true;
  });
});

describe('Delet eShift Function Test', () => {
  afterEach(() => sinon.restore());

  it('should delete a shift successfully', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = { params: { id } };

    const findByIdAndDeleteStub = sinon.stub(Shift, 'findByIdAndDelete').resolves({ _id: id });

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await deleteShift(req, res);

    expect(findByIdAndDeleteStub.calledOnceWith(id)).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ message: 'Shift deleted successfully' })).to.be.true;
  });

  it('should return 404 if shift is not found', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = { params: { id } };

    sinon.stub(Shift, 'findByIdAndDelete').resolves(null); // Simulate not found

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await deleteShift(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ error: 'Shift not found' })).to.be.true;
  });

  it('should return 500 if an error occurs', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = { params: { id } };

    sinon.stub(Shift, 'findByIdAndDelete').throws(new Error('DB Error'));

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await deleteShift(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ error: 'Failed to delete shift' })).to.be.true;
  });
});
