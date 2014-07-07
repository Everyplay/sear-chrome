/** @jsx React.DOM */

// React
var React = require('react');
var _ = require('underscore');

var ConfigView = React.createClass({
  render: function() {
    return <div>Sear</div>;
  }
});

React.renderComponent(<ConfigView  />, document.getElementById('content'));
