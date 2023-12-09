/**
 * Classes representing the teams playing in a tournament
 * Corresponds with qb schema objects
 * https://schema.quizbowl.technology/registration
 */

import Team from './Team';

/** A single school/organization at the tournament, which might enter multiple teams
 * Corresponds with qb schema objects
 * https://schema.quizbowl.technology/registration
 */
class Registration {
  /** name of the school / organization */
  name?: string;

  /** Where the school/organization is, in any human-readable format */
  location?: string;

  /** The teams registered to play by this school/organization */
  teams?: Team[];
}

export default Registration;
