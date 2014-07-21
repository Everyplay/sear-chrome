program:
	sear build --name sear-chrome
	sear build --name config --target config/ --index config.html

config-dev:
	sear server config --live_update --react_update --index config.html --port 8888
