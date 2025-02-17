import { getFileNameFromPath } from '../Utils/GeneralUtils';
import { Match } from './Match';

class MatchImportResult {
  filePath: string;

  errorMsg?: string;

  match?: Match;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  toString() {
    const fileName = getFileNameFromPath(this.filePath);
    if (this.errorMsg) return `${fileName} failed: ${this.errorMsg}`;
    return `${fileName}: Success`;
  }

  isSuccess() {
    return !this.errorMsg;
  }
}

export default MatchImportResult;
