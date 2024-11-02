const User = require('../models/User');

exports.getUser = async (name) => {
    const user = await User.findOne({ username: name }, '_id username email');
    return user;
}