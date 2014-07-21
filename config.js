/** @jsx React.DOM */

// React
var React = require('react');
var _ = require('underscore');
var bootstrap = require('bootstrap/less/bootstrap.less');

document.head.appendChild(bootstrap);

var Console = React.createClass({

  getInitialState: function() {
    return {
      consoleItems: [{
        type: 'log',
        src: 'local',
        content: 'Log'
      },
      {
        type: 'log',
        src: 'local',
        content: 'Log'
      }]
    };
  },

  render: function() {
    return (
      <div style={{marginLeft: 10, marginRight: 10}}>
        <div style={{
            width: '100%',
            marginLeft: 0,
            display: 'table',
            borderCollapse: 'collapse'
          }} ref="console">
          {_.map(this.state.consoleItems, function (item, index) {
            return (
             <div key={index} style={{
               display: 'table-row',
               width: '100%',
               borderBottom: '1px solid #F1F1F1'
               }}>
              <span className={"log-" + item.type + "-src"} style={{
                display: 'table-cell',
                borderRight: '1px solid #F1F1F1',
                paddingRight: 5
                }}>
                {item.src}
              </span>
              <span className={"log-" + item.type + "-content"} style={{
                width: '100%',
                display: 'table-cell',
                paddingLeft: 5
                }}>
                {item.content}
              </span>
            </div>
          );
          })}
        </div>
        <div style={{display: 'table', width: '100%'}}>
          <span style={
            {
              width: 15,
              display: 'table-cell'
              }
            }>&gt;</span>
          <input ref="consoleInput" style={
            {
              width: '100%',
              display: 'table-cell',
              border: 0,
              outline: 0
              }
            } type="text" />
        </div>
      </div>
    );
  }
});

var Settings = React.createClass({
  render: function() {
    return (
      <div>Settings are going to be here</div>
    );
  }
});

var Log = React.createClass({
  render: function() {
    return (
      <div>Log is going to be here</div>
    );
  }
});

var ConfigView = React.createClass({

  getInitialState: function() {
    return {
      tab: 'console'
    };
  },
  changeTab: function (tab) {
    return function (e) {
      e.preventDefault();
      this.setState({
        tab: tab
      });
    }.bind(this);
  },
  render: function() {

    var content;

    switch (this.state.tab) {
      case "console":
        content = <Console />;
        break;
      case "settings":
        content = <Settings />;
        break;
      case "log":
        content = <Log />;
        break;
    }

    return (
      <div>
        <div className="navigation">
          <ul className="nav nav-tabs" role="tablist">
            <li className={this.state.tab === 'console' ? 'active' : ''}><a href="#" onClick={this.changeTab('console')}>Console</a></li>
            <li className={this.state.tab === 'settings' ? 'active' : ''}><a href="#" onClick={this.changeTab('settings')}>Settings</a></li>
            <li className={this.state.tab === 'log' ? 'active' : ''}><a href="#" onClick={this.changeTab('log')}>Log</a></li>
          </ul>
        </div>
        <div className="content">
          {content}
        </div>
      </div>
    );
  }
});

React.renderComponent(<ConfigView  />, document.getElementById('content'));
