/**
 * Created by t_millal on 10/11/16.
 */



module.exports = function userSaidYes(text) {
    return ['yes', 'y', 'jeah', 'yee-haw'].indexOf(String(text).trim().toLowerCase()) >= 0;
};