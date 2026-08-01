const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = require('../app');
const connectDB = require('../config/db');
const User = require('../models/user.model');

describe('POST /api/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('_id');
    expect(res.body.data.user).toHaveProperty('email');
    expect(res.body.data.user).not.toHaveProperty('password');
  });
  
  it('should fail with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });
  
  it('should fail with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });
  
  it('should fail with missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
  
  it('should fail with missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com'
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});


beforeAll(async () => {

    await connectDB();

    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash(
        'password123',
        10
    );

    await User.create({

        firstName: 'Test',
        lastName: 'User',

        email: 'user@example.com',

        phoneNumber: '9876543210',

        password: hashedPassword,

        companyName: 'Test Company',

        industryType: 'IT',

        countryOrRegion: 'India'

    });

});

afterAll(async()=>{

    await User.deleteMany({});

    await mongoose.connection.close();

});