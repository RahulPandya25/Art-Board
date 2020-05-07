// user counts
let userCount = 0;
const incUserCount = () => ++userCount;
const decUserCount = () => --userCount;
const getUserCount = () => userCount;

let userList = [];
const addUser = (user) => userList.push(user);
const getUserList = () => userList;
const removeUser = (user) => {
  userList = userList.filter(function (element) {
    return element != user;
  });
};

module.exports = {
  incUserCount,
  decUserCount,
  getUserCount,
  addUser,
  getUserList,
  removeUser,
};
