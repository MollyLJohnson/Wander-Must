import React, { Component } from 'react';
import { Redirect, Link } from "react-router-dom";
import { withAlert } from 'react-alert';
import cloneDeep from 'lodash/cloneDeep';
import Profile from "./Profile";
import NavTabs from "../components/NavTabs";
import Moment from 'react-moment';
import Main from "../components/Main";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SuitcaseItems from "../components/SuitcaseItems";
import Blog from "../components/Blog.js"
import ConfirmationModal from "../components/ConfirmationModal";
import Yelp from "../utils/Yelp";
import suitcaseHandleWhite from "../images/suitcase-handle-white.png";
import "../styles/Suitcase.css";
import Wunderground from "../utils/Wunderground";
import gql from "graphql-tag";
import ApolloClient from 'apollo-boost';
import Autocomplete from 'react-autocomplete';


const GET_SUITCASE_QUERY = gql` 
query getSuitcase( $id: ID ){
  getSuitcase(id: $id) {
    id
    start_date
    end_date
    travel_category 
    note_title
    notes
    suitcase_image
    Items {
      id
      item_name
      item_category
      selected
      suitcase_items {
        item_amount
      }
    }
    Locale {
      id
      locale_city
      locale_admin
      locale_country
    }
    User {
      id
      username
      gender
    }
  }
}`;

const DELETE_SUITCASE_MUTATION = gql` 
mutation deleteSuitcase( $id: ID ){
    deleteSuitcase(id: $id) {
      id
    }
}`;

const ADD_ITEM_TO_SUITCASE_MUTATION = gql`
mutation addItemToSuitcase( $id: ID, $item_ids: [ID] ) {
  addItemToSuitcase (id: $id, item_ids: $item_ids) {
      id
      Items {
        id
    }
  }
}`;

const DELETE_ITEM_FROM_SUITCASE_MUTATION = gql`
mutation deleteItemFromSuitcase( $suitcase_id: ID, $item_id: ID ) {
  deleteItemFromSuitcase (suitcase_id: $suitcase_id, item_id: $item_id) {
      id
      Items {
        id
    }
  }
}`;

const UPDATE_ITEM_AMOUNT_ON_SUITCASE_MUTATION = gql`
mutation updateItemAmountOnSuitcase( $suitcase_id: ID, $item_id: ID, $item_amount: Int! ) {
  updateItemAmountOnSuitcase (suitcase_id: $suitcase_id, item_id: $item_id, item_amount: $item_amount) {
      id
  }
}`;

const client = new ApolloClient();

let cityNoUnderscores = "";
let autocompleteItems;
let renderAutoValue;


class Suitcase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      suitcase: {
        start_date: "",
        end_date: "",
        travel_category: "",
        note_title: "",
        notes: "",
        suitcase_image: "",
        Items: [],
        Locale: [],
        User: []
      },
      suitcaseItems: [],
      allItems: [],
      rendered: false,
      openConfirmationModal: false,
      thisSuitcaseId: this.props.match.params.id,
      currentSuitcaseId: localStorage.getItem("suitcase_id"),
      value: "",
      autocompleteSubmitError: "",
      currentPage: "SuitcaseItems",
      itemsToAdd: [],
      loggedInUserIdNumber: localStorage.getItem("logged_in_user_id")
    }

    this.constraints = {
      value: {
        presence: true
        }
    }
  };

  componentDidMount() {

    this.getSuitcase();

    client.query({
      query: gql` 
            { 
              allItems {
                id,
                item_name,
                item_category 
              }
            }`
    }).then(result => {
      this.setState({ allItems: result.data.allItems });
    })
  }

  getSuitcase = () => {
    client.query({
      query: GET_SUITCASE_QUERY,
      variables: { id: this.state.thisSuitcaseId },
      fetchPolicy: "network-only"
    }).then(result => {
      const clonedSuitcase = cloneDeep(result.data.getSuitcase);
      const clonedSuitcaseItems = cloneDeep(result.data.getSuitcase.Items);
      this.setState({ suitcase: clonedSuitcase, suitcaseItems: clonedSuitcaseItems, rendered: true });
    })
  }

  setAutocompleteItems = () => {
    if (this.state.value !== "") {
      autocompleteItems =
        this.state.allItems
          .map((wmItem, i) => (
            { key: i, id: wmItem.id, label: wmItem.item_name, category: wmItem.item_category.toLowerCase() }
          ))
    } else {
      autocompleteItems =
        [
          { key: "01", label: '' },
        ]
    }
    return autocompleteItems
  }

  renderAutocomplete = () => {
    if (this.state.value !== "") {
      renderAutoValue =
        (item, highlighted) =>
          <div
            key={item.key}
            id={item.id}
            style={{ backgroundColor: highlighted ? '#eee' : 'transparent' }}
          >
            {item.label} | <span className="auto-category">{item.category}</span>
          </div>
    } else {
      renderAutoValue =
        (item) =>
          <div
            key={item.key}
          >
          </div>
    }
    return renderAutoValue
  }

  renderWunderground = () => {
    if (this.state.rendered) {
      return (
        <Wunderground
          startDate={this.state.suitcase.start_date}
          endDate={this.state.suitcase.end_date}
          city={this.state.suitcase.Locale.locale_city}
          admin={this.state.suitcase.Locale.locale_admin}
          country={this.state.suitcase.Locale.locale_country}
        />
      )
    }
  }

  renderYelp = () => {
    if (this.state.rendered) {
      return (
        <div className="yelp-wrapper">
          <Yelp
            city={this.state.suitcase.Locale.locale_city}
            admin={this.state.suitcase.Locale.locale_admin}
            country={this.state.suitcase.Locale.locale_country}
          />
        </div>
      )
    }
  }

  renderCityWithoutUnderscores = () => {
    if (this.state.rendered) {
      cityNoUnderscores = this.state.suitcase.Locale.locale_city.replace(/_/g, ' ');
      return (
        cityNoUnderscores
      )
    }
  }

  showConfirmationModal = () => {
    this.setState({ openConfirmationModal: true });
  }

  resetConfirmationModal = () => {
    this.setState({ openConfirmationModal: false });
  }

  renderConfirmationModal = () => {
    if (this.state.openConfirmationModal) {
      return <ConfirmationModal
        resetConfirmationModal={this.resetConfirmationModal}
        deleteSuitcase={this.deleteSuitcase}
      />
    }
  }

  deleteSuitcase = () => {
    client.mutate({
      mutation: DELETE_SUITCASE_MUTATION,
      variables: { id: this.state.suitcase.id }
    }).then(result => {
      this.setState({
        shouldRedirectToProfile: true
      })
    })
  }

  addItemToSuitcase = () => {
    if (this.state.itemsToAdd.length) {
    this.setState({ autocompleteSubmitError: ""})
    client.mutate({
      mutation: ADD_ITEM_TO_SUITCASE_MUTATION,
      variables: { id: this.state.suitcase.id, item_ids: this.state.itemsToAdd },
      fetchPolicy: "no-cache"
    }).then(result => {
      this.getSuitcase();
      this.setState({ value: "", itemsToAdd: [] })
    }).catch(err => console.log(err))
  }
    else {
      this.setState({ autocompleteSubmitError: "You must select an item from our dropdown list"})
  }
}

  addItemsToCurrentSuitcase = () => {
    if (this.state.itemsToAdd.length) {
    client.mutate({
      mutation: ADD_ITEM_TO_SUITCASE_MUTATION,
      variables: { id: this.state.currentSuitcaseId, item_ids: this.state.itemsToAdd }
    }).then(result => {
        this.props.alert.show(<div className="success-alert">You added these items to your suitcase</div>);
      this.setState({
        itemsToAdd: [],
        thisSuitcaseId: this.props.match.params.id
      });
    }).catch(err => console.log(err))
  }
  }

  deleteItemFromSuitcase = (itemId) => {
    client.mutate({
      mutation: DELETE_ITEM_FROM_SUITCASE_MUTATION,
      variables: { suitcase_id: this.state.suitcase.id, item_id: itemId },
      fetchPolicy: "no-cache"
    }).then(result => {
      this.getSuitcase();
    }).catch(err => console.log(err))
  }

  updateItemAmountOnSuitcase = (itemId, itemAmount) => {
    client.mutate({
      mutation: UPDATE_ITEM_AMOUNT_ON_SUITCASE_MUTATION,
      variables: { suitcase_id: this.state.suitcase.id, item_id: itemId, item_amount: itemAmount },
      fetchPolicy: "no-cache"
    }).then(result => {
      this.getSuitcase();
      
    }).catch(err => console.log(err))
  }

  maybeRedirect() {
    if (this.state.shouldRedirectToProfile) {
      return (
        <Redirect to={"/profile/" + this.state.loggedInUserIdNumber} render={(props) => <Profile {...props} />} />
      )
    }
  }

  setSuitcaseId = () => {
    localStorage.setItem("suitcase_id", this.state.suitcase.id);
  }

  handleSelected = (selectedId) => {
    let tempSuitcase = [...this.state.suitcaseItems];

    tempSuitcase.map(item => {
      if (item.id === selectedId) {
        item.selected = !item.selected
      }
      return item;
    });

    this.setState({
      suitcaseItems: [...tempSuitcase],
      itemsToAdd: this.state.suitcaseItems.filter(item => item.selected).map(item => item.id)
    });

  }

  handleSelectAll = (e, category) => {
    let tempSuitcase = [...this.state.suitcaseItems];
    // if clicking on the button when the check is visible
    if (e.target.classList.contains('check-all')) {
      // check all of them
      tempSuitcase.map(item => {
        if (item.item_category === category) {
          item.selected = true;
        }
        return item;
      });

      this.setState({
        suitcaseItems: [...tempSuitcase],
        itemsToAdd: this.state.suitcaseItems.filter(item => item.selected).map(item => item.id)
      })
    }

    // if clicking on the button when the x is visible
    if (e.target.classList.contains('uncheck-all')) {
      // uncheck all of them
      tempSuitcase.map(item => {
        if (item.item_category === category) {
          item.selected = false;
        }
        return item;
      });

      this.setState({
        suitcaseItems: [...tempSuitcase],
        itemsToAdd: this.state.suitcaseItems.filter(item => item.selected).map(item => item.id)
      })
    }
  }

  handlePageChange = page => {
    this.setState({ currentPage: page });
  };

  renderPage = () => {
    if (this.state.currentPage === "SuitcaseItems") {
      return (
        <div>
          {this.state.loggedInUserIdNumber === this.state.suitcase.User.id ? (
          <div>
            <div className="input-group mb-3 auto-items">

              <Autocomplete

                items={this.setAutocompleteItems()}
                shouldItemRender={(item, value) => item.label.toLowerCase().indexOf(value.toLowerCase()) > -1}
                getItemValue={item => item.label}
                renderItem={this.renderAutocomplete()}
                wrapperStyle={
                  {
                    position: 'relative',
                    zIndex: 9999
                  }
                }
                menuStyle={
                  {
                    position: 'absolute',
                    cursor: "pointer",
                    top: "35px",
                    left: 0,
                    backgroundColor: "white"
                  }
                }
                value={this.state.value}
                onChange={e => this.setState({ value: e.target.value, itemsToAdd: [] })}
                onSelect={(value, item, autocompleteSubmitError) => this.setState({ value: value, itemsToAdd: [...this.state.itemsToAdd, item.id], autocompleteSubmitError: "" })}
              />
              <div className="input-group-append">
                <button className="add-one-item" type="button" onClick={() => { this.addItemToSuitcase() }}><i className="fa fa-search"></i> Add an item</button>
              </div>
            </div>
            <p className="autocomplete-error">{this.state.autocompleteSubmitError}</p>
            </div>


          ) : (
              <div></div>
            )}

          <SuitcaseItems
            suitcase={this.state.suitcase}
            suitcaseItems={this.state.suitcaseItems}
            currentSuitcaseId={this.state.currentSuitcaseId}
            itemsToAdd={this.itemsToAdd}
            handleSelected={this.handleSelected}
            handleSelectAll={this.handleSelectAll}
            loggedInUserIdNumber={this.state.loggedInUserIdNumber}
            suitcaseUserId={this.state.suitcase.User.id}
            deleteItemFromSuitcase={this.deleteItemFromSuitcase}
            setSuitcaseId={this.setSuitcaseId}
            addItemsToCurrentSuitcase={this.addItemsToCurrentSuitcase}
            updateItemAmountOnSuitcase={this.updateItemAmountOnSuitcase}
            renderYelp={this.renderYelp}
          />
        </div>
      )
    } else {
      return (
        <div className="blog-wrapper">
          <Blog
            suitcase_id={this.state.suitcase.id}
            note_title={this.state.suitcase.note_title}
            notes={this.state.suitcase.notes}
            suitcaseImage={this.state.suitcase_image}
            renderCityWithoutUnderscores={this.renderCityWithoutUnderscores}
            suitcaseUsername={this.state.suitcase.User.username}
            loggedInUserIdNumber={this.state.loggedInUserIdNumber}
            suitcaseUserId={this.state.suitcase.User.id}
            showConfirmationModal={this.showConfirmationModal}
            suitcase_image={this.state.suitcase.suitcase_image}
          />
        </div>
      )
    }
  }

  render() {
    return (
      <div className="suitcase profile-page sidebar-collapse">
        {this.maybeRedirect()}
        <Header
          showNewSuitcaseModal={this.props.showNewSuitcaseModal}
          loggedInUserIdNumber={this.state.loggedInUserIdNumber}
        />
        <Main>
          <div className="page-header header-filter" data-parallax="true" id="background-suitcase"></div>
          <div className="main main-raised">
            <div className="profile-content">

              <div className="container">
                <div className="row">
                  <div className="col-md-6 ml-auto mr-auto">
                    <div className="profile profile-handle">
                      <div className="handle">
                        <img src={suitcaseHandleWhite} alt="WM Handle" className="handle-image" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card card-nav-tabs card-plain">
                  <div className="suitcase-header card-header card-header-default">

                    <div id="suitcase-nav" className="nav-tabs-navigation">
                      <div className="nav-tabs-wrapper">
                        <ul className="nav suitcase-nav">
                          <li className="nav-item ">
                            <p className="nav-link" id="suitcase-user">{this.state.suitcase.User.username}</p>
                          </li>
                          <li className="nav-item ">
                            <p className="nav-link" id="suitcase-user-gender">{this.state.suitcase.User.gender}</p>
                          </li>
                          <li className="nav-item ">
                            <Link className="nav-link" id="suitcase-locale" to={"/search/" + this.state.suitcase.Locale.locale_city}>{this.renderCityWithoutUnderscores()}</Link>
                          </li>

                          {this.state.rendered ? (
                            <li className="nav-item">
                              <p className="nav-link d-inline-block" id="suitcase-startDate">
                                <Moment format="MMM DD, YYYY">
                                  {this.state.suitcase.start_date}
                                </Moment>
                              </p>-
                              <p className="nav-link d-inline-block" id="suitcase-endDate">
                                <Moment format="MMM DD, YYYY">
                                  {this.state.suitcase.end_date}
                                </Moment>
                              </p>
                            </li>
                          ) : (
                              <li className="nav-item">
                                Loading . . .
                              </li>
                            )}

                          <li className="nav-item">
                            <p className="nav-link" id="suitcase-travelCategory">{this.state.suitcase.travel_category}</p>
                          </li>

                          <li className="nav-item">
                            <NavTabs
                              currentPage={this.state.currentPage}
                              handlePageChange={this.handlePageChange}
                            />
                          </li>

                        </ul>
                        {this.renderWunderground()}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {this.renderPage()}

            </div>

          </div>

        </Main>
        {this.props.renderNewSuitcaseModal()}
        {this.renderConfirmationModal()}
        <Footer />
      </div>
    )
  }
};

export default withAlert(Suitcase);