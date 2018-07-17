var React = require('react');

class HeaderNav extends React.Component{

  constructor(props) {
    super(props);
    this.handleSort = this.handleSort.bind(this);
    this.handleOrder = this.handleOrder.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.setPane = this.setPane.bind(this);
  }

  handleSort(e) {
    this.props.onReOrder(e.target.id, this.props.orderDir);
  } //handleSort

  handleOrder(e) {
    this.props.onReOrder(this.props.orderBy, e.target.id);
  } //handleOrder

  handleSearch(e) {
    this.props.onSearch(e.target.value);
  } //handleSearch

  setPane(e) {
    this.props.setPane(e.target.id);
  } //setPane

  render() {
    return(
      <nav>
        <div className="nav-wrapper">
          <a className="brand-logo" href="#">YellowFruit</a>
          <ul id="nav-mobile" className="right">
            <li><a href="#" id="teamsPane" onClick={this.setPane}>Teams</a></li>
            <li><a href="#" id="gamesPane" onClick={this.setPane}>Games</a></li>
            <li>
              <form>
                <div className="input-field">
                  <input id="search" type="search" onChange={this.handleSearch} placeholder="Search" autoFocus type="text" className="form-control" aria-label="Search Appointments" />
                </div>
              </form>
            </li>
          </ul>
        </div>
      </nav>

    ) // return
  }//render
}; //HeaderNav

module.exports = HeaderNav;


/*  TODO: re-implement sorting

    <div className="input-group">
    <div className="input-group-btn">
      <button type="button" className="btn btn-info dropdown-toggle"
        data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Sort by: <span className="caret"></span></button>
        <ul className="dropdown-menu dropdown-menu-right">
          <li><a href="#" id="teamName" onClick={this.handleSort}>Team Name {(this.props.orderBy === 'teamName') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
          <li><a href="#" id="roster" onClick={this.handleSort}>Roster {(this.props.orderBy === 'roster') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
          <li role="separator" className="divider"></li>
          <li><a href="#" id="asc" onClick={this.handleOrder}>Asc {(this.props.orderDir === 'asc') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
          <li><a href="#" id="desc" onClick={this.handleOrder}>Desc {(this.props.orderDir === 'desc') ? <span className="glyphicon glyphicon-ok"></span>:null}</a></li>
        </ul>
    </div>
  </div> */
