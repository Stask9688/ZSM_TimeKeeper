/**
 * Created by Stas on 6/6/2017.
 */
import React from "react"
import ReactDOM from "react-dom"

let HelloMessage = React.createClass({
    render: function () {
        return <h1>Hello {this.props.message}! </h1>;
    }
});

React.render(<HelloMessage message="World" /> , document.getElementById('container'));