const pwGenService = require('../services/pwGenService.js');
/**
 * @description interactor that handles user requests based on users permissions
 */
const plannedProbandsInteractor = (function () {
  async function getPlannedProband(decodedToken, user_id, pgHelper) {
    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    switch (userRole) {
      case 'Untersuchungsteam':
        return pgHelper
          .getPlannedProbandAsUser(user_id, requester)
          .catch((err) => {
            console.log(err);
            throw new Error(
              'Could not get planned proband, because user has no access or it does not exist'
            );
          });
      default:
        throw new Error(
          'Could not get the planned proband: Unknown or wrong role'
        );
    }
  }

  async function getPlannedProbands(decodedToken, pgHelper) {
    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    switch (userRole) {
      case 'Untersuchungsteam':
        return pgHelper.getPlannedProbandsAsUser(requester).catch((err) => {
          console.log(err);
          throw new Error(
            'Could not get planned probands, because user has no access'
          );
        });
      default:
        throw new Error(
          'Could not get the planned probands: Unknown or wrong role'
        );
    }
  }

  async function createPlannedProbands(decodedToken, pseudonyms, pgHelper) {
    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    switch (userRole) {
      case 'Untersuchungsteam':
        return pgHelper
          .getUser(requester)
          .then((requesterObject) => {
            if (requesterObject && requesterObject.study_accesses.length > 0) {
              const plannedProbandsToCreate = [];
              pseudonyms.forEach((pseudonym) => {
                plannedProbandsToCreate.push([
                  pseudonym,
                  pwGenService.genRandomPw(),
                  null,
                ]);
              });
              const study_accesses = requesterObject.study_accesses.map(
                (access) => access.study_id
              );
              return pgHelper
                .createPlannedProbands(plannedProbandsToCreate, study_accesses)
                .catch((err) => {
                  console.log(err);
                  throw new Error('could not create planned probands: ' + err);
                });
            } else {
              throw new Error(
                'Could not create the planned probands: User has no write access to any study'
              );
            }
          })
          .catch((err) => {
            console.log(err);
            throw new Error('could not create planned probands: ' + err);
          });
      default:
        throw new Error(
          'Could not create the planned probands: Unknown or wrong role'
        );
    }
  }

  async function deletePlannedProband(decodedToken, user_id, pgHelper) {
    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    switch (userRole) {
      case 'Untersuchungsteam':
        return pgHelper
          .deletePlannedProbandAsUser(user_id, requester)
          .catch((err) => {
            console.log(err);
            throw new Error('could not delete planned proband: ' + err);
          });
      default:
        throw new Error(
          'Could not delete the planned proband: Unknown or wrong role'
        );
    }
  }

  return {
    /**
     * @function
     * @description gets a planned proband from DB if user is allowed to
     * @memberof module:plannedProbandsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {string} user_id the id of the planned proband to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getPlannedProband: getPlannedProband,

    /**
     * @function
     * @description gets all planned probands from DB the user has access to
     * @memberof module:plannedProbandsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getPlannedProbands: getPlannedProbands,

    /**
     * @function
     * @description creates planned probands in DB if they do not exist and the requester is allowed to
     * @memberof module:plannedProbandsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {array} pseudonyms the pseudonyms array to create
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createPlannedProbands: createPlannedProbands,

    /**
     * @function
     * @description deletes a planned proband and all its data from DB if user is allowed to
     * @memberof module:plannedProbandsInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {string} user_id the id of the planned proband to delete
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    deletePlannedProband: deletePlannedProband,
  };
})();

module.exports = plannedProbandsInteractor;