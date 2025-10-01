const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();
const { registerUser, loginUser, getProfile, updateUserProfile, getAllUsers } = require('../controllers/authController');
const { expect } = chai;

describe('register User Function Test', () => {
  afterEach(() => sinon.restore()); // Restore all stubs/spies after each test

  it('should register user successfully', async () => {
    // Mock request body
    const req = {
      body: {
        name: "Alice Johnson",
        email: "alice@test.com",
        password: "password123",
        role: "worker",
        dob: new Date("2000-08-11T08:00:00Z"),
      },
    };

    // Stub User.prototype.save to simulate successful DB save
    const findStub = sinon.stub(User, 'findOne').resolves(null);
    const saveStub = sinon.stub(User.prototype, 'save').resolvesThis();
    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };
    await registerUser(req, res);

    // Assertions
    expect(saveStub.calledOnce).to.be.true;
    expect(findStub.calledOnce).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
  });

  it('should return user already exists error', async () => {
    // Mock request body
    const req = {
      body: {
        name: "Alice Johnson",
        email: "alice@test.com",
        password: "password123",
        role: "worker",
        dob: new Date("2000-08-11T08:00:00Z"),
      },
    };

    // Stub User.prototype.save to simulate successful DB save
    const findStub = sinon.stub(User, 'findOne').resolves(req.body.email);
    //const saveStub = sinon.stub(User.prototype, 'save').resolvesThis();
    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };
    // Call controller
    await registerUser(req, res);

    // Assertions
    expect(findStub.calledOnce).to.be.true;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'User already exists' })).to.be.true;
  });

  it('Create fail if person less than 14 years old', async () => {
    // Mock request body
    const req = {
      body: {
        name: "Alice Johnson",
        email: "alice@test.com",
        password: "password123",
        role: "worker",
        dob: new Date("2015-08-11T08:00:00Z"),
      },
    };

    // Stub User.prototype.save to simulate successful DB save
    const findStub = sinon.stub(User, 'findOne').resolvesThis(null);
    const saveStub = sinon.stub(User.prototype, 'save').resolvesThis();

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    // Call controller
    await registerUser(req, res);

    // Assertions
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.firstCall.args[0]).to.include({
      message: 'Apologies, but you are too young to work under Australian Compliance',
    });
  });

  it('should return 500 if an error occurs', async () => {
    // Simulate error during save
    const findStub = sinon.stub(User, 'findOne').resolves(null);
    sinon.stub(User.prototype, 'save').throws(new Error('DB Error'));

    const req = {
      body: {
        name: "Alice Johnson",
        email: "alice@test.com",
        password: "password123",
        role: "worker",
        dob: new Date("2000-08-11T08:00:00Z"),
      },
    };

    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await registerUser(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
  });
});

describe('Get User Profile Function Test', () => {
  afterEach(() => sinon.restore()); // Restore all stubs/spies after each test

  it('should get user profile successfully', async () => {
    // Mock request body
    const user =
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Jack Smith",
      email: "jack@test.com",
      password: "password123",
      role: "worker",
      dob: new Date("2000-08-11T08:00:00Z"),
    };
    const findStub = sinon.stub(User, 'findById').resolves(user);
    const req =
    {
      user: {
        id: user._id.toString(),
      }
    };

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    // Call controller
    await getProfile(req, res);

    // Assertions
    expect(findStub.calledOnce).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
  });
});

describe('updateUserProfile', () => {
  afterEach(() => sinon.restore()); // Restore all stubs/spies after each test
  it('Update User profile', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const existingUser = {
      _id: id,
      name: "Alice Johnson",
      email: "alice@test.com",
      role: "worker",
      dob: new Date("2000-08-11T08:00:00Z"),
      save: sinon.stub().resolvesThis(),

    };
    const findByIdStub = sinon.stub(User, 'findById').resolves(existingUser);

    const req = {
      user: { id },
      body: { name: "New Name", email: "alice@test.com", role: "worker" },
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };

    await updateUserProfile(req, res);


    // Assertions
    expect(findByIdStub.calledOnceWith(id)).to.be.true;
    expect(res.json.firstCall.args[0].name).to.equal('New Name'); // Ensure name is updated
    expect(existingUser.save.calledOnce).to.be.true;
    expect(res.status.called).to.be.false;
    expect(res.json.calledOnce).to.be.true;
  });

  it('return error user not found', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const existingUser = {
      _id: id,
      name: "Alice Johnson",
      email: "alice@test.com",
      role: "worker",
      dob: new Date("2000-08-11T08:00:00Z"),
      save: sinon.stub().resolvesThis(),

    };

    const findByIdStub = sinon.stub(User, 'findById').resolves(null);


    const req = {
      user: { id },
      body: { name: "New Name", email: "alice@test.com", role: "worker" },
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };

    await updateUserProfile(req, res);


    // Assertions
    expect(findByIdStub.calledOnceWith(id)).to.be.true;
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'User not found' })).to.be.true;

  });

  it('should return 500 if database error occurs', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const existingUser = {
      _id: id,
      name: "Alice Johnson",
      email: "alice@test.com",
      role: "worker",
      dob: new Date("2000-08-11T08:00:00Z"),
      save: sinon.stub().resolvesThis(),

    };

    const findByIdStub = sinon.stub(User, 'findById').throws(new Error('DB Error'));


    const req = {
      user: { id },
      body: { name: "New Name", email: "alice@test.com", role: "worker" },
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };

    await updateUserProfile(req, res);


    // Assertions
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ message: 'DB Error' })).to.be.true;

  });

});

describe('login User Function Test', () => {
  afterEach(() => sinon.restore()); // Restore all stubs/spies after each test
  it('should login user successfully', async () => {
    const bcrypt = require('bcrypt'); // Assuming bcrypt is imported

    // Stub bcrypt.compare to always return true
    // Mock request body
    const req = {
      body: {
        email: "alice@test.com",
        password: "password123",
      },
    };
    const existingUser = {
      email: "alice@test.com",
      password: "password123",
      save: sinon.stub().resolvesThis(),
    };
    // Stub User.prototype.save to simulate successful DB save
    const findStub = sinon.stub(User, 'findOne').resolves(existingUser);
    const bcryptCompareStub = sinon.stub(bcrypt, 'compare').resolves(true);

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    // Call controller
    await loginUser(req, res);

    // Assertions
    expect(findStub.calledOnce).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.firstCall.args[0]).to.include({
      email: req.body.email,
      name: req.body.name,
      role: req.body.role
    });
  });
  it('should return 401 error for invalid credentials', async () => {
    const bcrypt = require('bcrypt'); // Assuming bcrypt is imported

    // Stub bcrypt.compare to always return true
    // Mock request body
    const req = {
      body: {
        email: "alice@test.com",
        password: "password123",
      },
    };
    const existingUser = {
      email: "alice@test.com",
      password: "password123",
      save: sinon.stub().resolvesThis(),
    };
    // Stub User.prototype.save to simulate successful DB save
    const findStub = sinon.stub(User, 'findOne').resolves(existingUser);
    const bcryptCompareStub = sinon.stub(bcrypt, 'compare').resolves(false);

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    // Call controller
    await loginUser(req, res);
    // Assertions
    expect(findStub.calledOnce).to.be.true;
    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.firstCall.args[0]).to.include({ message: 'Invalid email or password' });
  });
});
