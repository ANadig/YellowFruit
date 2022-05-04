/***********************************************************
ImportSidebar.tsx
Andrew Nadig

React component representing the results of importing some
games
***********************************************************/
import * as React from 'react';
import { ImportResult } from './YfTypes';

interface ImportSidebarProps {
  results: ImportResult;
  close: () => void;
}

export class ImportSidebar extends React.Component<ImportSidebarProps, {}>{

  constructor(props: ImportSidebarProps) {
    super(props);
    this.close = this.close.bind(this);
  }

  /**
   * Clear this info (and go back to the normal stats sidebar )
   */
  close(): void {
    this.props.close();
  }

  getRejectHeader(): JSX.Element {
    if(this.props.results.rejected.length < 1) { return null; }
    return ( <p><i className="material-icons red-text text-darken-4">close</i>The following games were not imported:</p> );
  }

  getRejectList(): JSX.Element {
    if(this.props.results.rejected.length < 1) { return null; }
    const lines = this.props.results.rejected.map((res, idx) => {
      return <li key={idx}>{res.fileName}: {res.message}</li>
    });
    return <ul>{lines}</ul>
  }

  getErrorCount(): JSX.Element {
    let errors = this.props.results.errors;
    if(errors < 1) { return null; }
    const plural = errors == 1 ? '' : 's';
    return ( <p><i className="material-icons red-text text-darken-4">error</i>&nbsp;{`${errors} game${plural} imported with errors`}</p> );
  }

  getWarningCount(): JSX.Element {
    let warnings = this.props.results.warnings;
    if(warnings < 1) { return null; }
    const plural = warnings == 1 ? '' : 's';
    return ( <p><i className="material-icons yellow-text text-accent-4">warning</i>&nbsp;{`${warnings} game${plural} imported with warnings`}</p> );
  }

  getSuccessCount(): JSX.Element {
    let successes = this.props.results.successes;
    if(successes < 1) { return null; }
    const plural = successes == 1 ? '' : 's';
    return ( <p><i className="material-icons green-text">check_circle</i>&nbsp;{`${successes} game${plural} imported with no issues`}</p> );
  }

  getRejectFooter(): JSX.Element {
    if(this.props.results.errors || this.props.results.warnings || this.props.results.successes) {
      return null;
    }
    const rejects = this.props.results.rejected.length;
    if(rejects < 1) { return null; }
    return ( <p>{`0 of ${rejects} files were imported.`}</p> );
  }

  allSuccesses(closeButton: JSX.Element): JSX.Element {
    let successes = this.props.results.successes;
    const plural = successes == 1 ? '' : 's';
    return (
      <div>
        {closeButton}
        <h5>Import Results</h5>
        <br/>
        <h6>Lookin' Good!</h6>
        <p>{`Successfully imported ${successes} game${plural}`}</p>
        <div className="import-success-img">
          <img src="success-banana.png" width="90" height="218"/><br/><br/>
        </div>
      </div>
    );
  }

  render() {
    const closeButton = (
      <button className="btn-flat grey lighten-3 waves-effect" onClick={this.close}>
        <i className="material-icons">close</i>
      </button>
    );

    if(this.props.results.rejected.length == 0 && this.props.results.errors == 0 && this.props.results.warnings == 0) {
      return this.allSuccesses(closeButton);
    }

    return (
      <div>
        {closeButton}
        <h5>Import Results</h5>
        {this.getRejectHeader()}
        {this.getRejectList()}
        {this.getErrorCount()}
        {this.getWarningCount()}
        {this.getSuccessCount()}
        {this.getRejectFooter()}
      </div>
    );
  }
}
