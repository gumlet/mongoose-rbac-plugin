/* eslint-env jest */

const mongoose = require('mongoose')
const role = require('../src/index')

const Schema = mongoose.Schema
const testSchema = {
  name: String
}

beforeAll(() => {
  return mongoose.connect(
    'mongodb://127.0.0.1/mongoose-role-test', {
      useNewUrlParser: true
    }
  )
})

afterAll(() => {
  return mongoose.connection.db
    .dropDatabase()
    .then(() => mongoose.disconnect())
})

test('should give accurate user account lockage', () => {
  const TestSchema = new Schema(testSchema)
  TestSchema.plugin(role, {
    roles: ['user', 'admin'],
    accessLevels: {
      user: ['user', 'admin'],
      admin: ['admin']
    }
  })
  const Test = mongoose.model('Test1', TestSchema)
  const model1 = new Test({
    name: 'test1',
    roles: ['user']
  })
  const model2 = new Test({
    name: 'test2',
    roles: ['admin']
  })
  expect(model1.hasAccess('user')).toBe(true)
  expect(model1.hasAccess('admin')).toBe(false)
  expect(model2.hasAccess('user')).toBe(true)
  expect(model2.hasAccess('admin')).toBe(true)
  expect(model1.hasAccess()).toBe(false)
  expect(model1.hasAccess('public')).toBe(false)
})

test("should not break completely if options aren't passed", function (done) {
  const TestSchema = new Schema(testSchema)
  TestSchema.plugin(role)
  const Test = mongoose.model('Test2', TestSchema)
  const model1 = new Test({
    name: 'test1',
    roles: ['user']
  })
  const model2 = new Test({
    name: 'test2',
    roles: ['admin']
  })
  expect(model1.hasAccess('user')).toBe(false)
  expect(model1.hasAccess('admin')).toBe(false)
  expect(model2.hasAccess('user')).toBe(false)
  expect(model2.hasAccess('admin')).toBe(false)
  expect(model1.hasAccess()).toBe(false)
  expect(model1.hasAccess('public')).toBe(false)
  model1.save(function (err, model) {
    // console.log(err);
    // console.log(err.errors.role.kind);
    expect(err).toBe(null)
    done()
  })
})

test('should work with an array of access levels', function () {
  const TestSchema = new Schema(testSchema)
  TestSchema.plugin(role, {
    roles: ['anon', 'user', 'admin'],
    accessLevels: {
      public: ['anon', 'user', 'admin'],
      private: ['user', 'admin'],
      protected: ['admin']
    }
  })
  const Test = mongoose.model('Test3', TestSchema)
  const model1 = new Test({
    name: 'test1',
    roles: ['anon']
  })
  const model2 = new Test({
    name: 'test2',
    roles: ['user']
  })
  const model3 = new Test({
    name: 'test3',
    roles: ['admin']
  })
  expect(model1.hasAccess()).toBe(false)
  expect(model1.hasAccess('public')).toBe(true)
  expect(model1.hasAccess(['public', 'private'])).toBe(false)
  expect(model2.hasAccess(['public', 'private'])).toBe(true)
  expect(model2.hasAccess(['private', 'protected'])).toBe(false)
  expect(model3.hasAccess(['public', 'private', 'protected'])).toBe(true)
})

test('should work with multiple roles', function () {
  const TestSchema = new Schema(testSchema)
  TestSchema.plugin(role, {
    roles: ['user', 'admin', 'public'],
    accessLevels: {
      user: ['user', 'admin'],
      admin: ['admin'],
      public: ['public']
    }
  })
  const Test = mongoose.model('Test4', TestSchema)
  const model1 = new Test({
    name: 'test1',
    roles: ['user', 'public']
  })
  expect(model1.hasAccess(['public', 'user'])).toBe(true)
})
