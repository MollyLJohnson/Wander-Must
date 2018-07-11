import React, { Component } from 'react';
import { Button, Col, Form, FormGroup, Label, Input, CustomInput } from 'reactstrap';
import "../styles/Blog.css";
import Pixabay from '../utils/Pixabay';
import ApolloClient from 'apollo-boost';
import axios from 'axios';
import gql from "graphql-tag";

const client = new ApolloClient();

const GET_SUITCASE_QUERY = gql`
query getSuitcase( $id: ID ){
  getSuitcase(id: $id) {
    note_title
    notes
    suitcase_image
    Locale {
        id
        locale_city
        locale_admin
        locale_country
    }
  }
}`;

const UPDATE_SUITCASE_IMAGE_MUTATION = gql`
  mutation updateImageOnSuitcase( $id: ID, $suitcase_image: String! ){
    updateImageOnSuitcase( id: $id, suitcase_image: $suitcase_image){
      id
      suitcase_image
    }
  }`;

const UPDATE_SUITCASE_NOTE_MUTATION = gql`
  mutation updateNoteOnSuitcase( $id: ID, $note_title: String!, $notes: String! ){
    updateNoteOnSuitcase( id: $id, note_title: $note_title, note: $notes){
      id
      note_title
      notes
    }
}`;

export default class Blog extends Component {
    state = {
        id: this.props.suitcase_id,
        note_title: "",
        notes: "",
        suitcase_image: "",
        fileName: "Upload your image here!",
        imageData: "",
        defaultImage: false,
        
    }

    componentDidMount(){
      
        this.getSuitcase();

    }

    getSuitcase = () => {
        client.query({
          query: GET_SUITCASE_QUERY,
          variables: { id: this.state.id },
          fetchPolicy: "network-only"
        })
            .then( result => {
                let newState = { 
                    note_title: result.data.getSuitcase.note_title,
                    notes: result.data.getSuitcase.notes,
                    suitcase_image: result.data.getSuitcase.suitcase_image,
                    city: result.data.getSuitcase.Locale.locale_city,
                    country: result.data.getSuitcase.Locale.locale_country,
                    admin: result.data.getSuitcase.Locale.locale_admin,
                    defaultImage: (result.data.getSuitcase.suitcase_image === null)
                }

                this.setState(newState) 
            })
    }

    handleInputChange = event => {
        const { name, value } = event.target;

        // Set the state for the appropriate input field
        this.setState({
            [name]: value
        });
    };

    renderPixabay = event => {
        event.preventDefault();
        
        if( ! this.state.defaultImage ){
            this.setState({defaultImage: true})
        }

        this.maybeMakePixabayCall();
    }

    maybeMakePixabayCall = () => {
        if( this.state.defaultImage === true ){
            return <Pixabay
                    city={this.state.city}
                    country={this.state.country}
                    setCityImageSrc={this.setCityImageSrc}
                />            
        }        
    }

    setCityImageSrc = (url) => {
        this.setState({ suitcase_image: url })
        console.log(url)
    }

    handleImageChange = event => {
        let file = event.target.files[0];
        let imageData = new FormData();
        imageData.append("file", file);
        imageData.append("upload_preset", "qocvkmel");

        this.setState({ 
            imageData : imageData,
            fileName: file.name,
            defaultImage: false
        });
    }

    handleFormSubmit = event => {
        event.preventDefault();
        
        let existingData = {...this.state};
        let updated = {
            note_title: this.state.note_title,
            notes: this.state.notes,
            suitcase_image: this.state.suitcase_image
        };

        Object.keys(updated).forEach( item => updated[item] ? null: delete updated[item] );

        updated = {...existingData, ...updated};
        console.log(updated);

        axios({
            method: "POST",
            url: "https://api.cloudinary.com/v1_1/wandermust/upload/c_fill,h_350,w_350",
            data: this.state.imageData
          })
            .then( res => {
              const secure_url = res.data.secure_url;
      
              this.setState({ 
                suitcase_image: secure_url,
                fileName: "Upload your image here!" 
              });
              
              client.mutate({
                mutation: UPDATE_SUITCASE_IMAGE_MUTATION,
                variables: { id: this.state.id, suitcase_image: secure_url },
                fetchPolicy: 'no-cache'
              })
                .catch( err => console.log(err.message) )
            })

        client.mutate({
            mutation: UPDATE_SUITCASE_NOTE_MUTATION,
            variables: { id: this.state.id, note_title: this.state.note_title, notes: this.state.notes },
            fetchPolicy: 'no-cache'
        })
            .catch( err => console.log(err.message) );
    };



    render() {
        return (
            <div className="blog">
                <Form onSubmit={this.setTerm}>
                    <FormGroup row>
                        <Col sm={1} />
                        <Col sm={2}>
                            <Label for="note_title" sm={3}>Title</Label>
                        </Col>
                        <Col sm={7}>
                            <Input
                                type="text"
                                name="note_title"
                                placeholder={this.props.note_title}
                                value={this.state.note_title}
                                onChange={this.handleInputChange}
                            />
                        </Col>
                    </FormGroup>
                    <FormGroup row>
                        <Col sm={1} />
                        <Col sm={2}>
                            <Label for="notes" sm={3}>Body</Label>
                        </Col>
                        <Col sm={7}>
                            <Input
                                type="textarea"
                                name="notes"
                                rows={8}
                                value={this.state.notes}
                                onChange={this.handleInputChange}
                            />
                        </Col>
                    </FormGroup>
                    <FormGroup row>
                        <Col sm={1} />
                        <Col sm={2}>
                            <Label for="exampleFile" >Your Suitcase Image</Label>
                        </Col>
                        <Col sm={4}>
                            <CustomInput 
                                type="file" 
                                name="file" 
                                id="exampleFile" 
                                label={this.state.fileName} 
                                onChange={this.handleImageChange}
                            />
                            {/* <FormText color="muted">
                            Upload a photo for your suitcase! If you don't, we can provide a picture for you.
                            </FormText> */}
                            <Button
                                inline type="radio" name="file" color="default"
                                className="float-right"
                                onClick={this.renderPixabay}
                                value={this.cityImageSrc}
                            > ...or use default image </Button>
                            { this.maybeMakePixabayCall() }
                        </Col>

                        <Col sm={3}>
                            <div className="currentSuitcaseImage">
                                <img 
                                width="100%" 
                                src={this.state.suitcase_image} 
                                alt="suitcase background"
                                />
                            </div>
                        </Col>
                       


                    </FormGroup>
                    <FormGroup check row>
                        <Col sm={{ size: 2, offset: 5 }}>
                            <Button color="primary" onClick={this.handleFormSubmit} >Submit</Button>
                        </Col>
                    </FormGroup>
                </Form>

                {/* <div className="row">
                    <div className="col-12 text-center">
                        {this.props.loggedInUserIdNumber === this.props.suitcaseUserId ? (
                            <button className="btn btn-primary" onClick={() => { this.props.showConfirmationModal() }}><i className="fa fa-trash mr-2"></i> Delete this suitcase</button>
                        ) : (<div></div>
                            )}
                    </div>
                </div> */}

            </div>
        )
    }
}