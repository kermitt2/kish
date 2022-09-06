# KISP

__Keep It Simple and Painful__

## Requirements and install

The present tool is implemented in Python and should work correctly with Python 3.7 or higher. 

Get the github repo:

```console
git clone https://github.com/kermitt2/kisp
cd kisp
```
It is strongly advised to setup first a virtual environment to avoid falling into one of these gloomy python dependency marshlands - you can adjust the version of Python to be used, but be sure to be 3.7 or higher:

```console
virtualenv --system-site-packages -p python3.8 env
source env/bin/activate
```

Install the dependencies:

```console
python3 -m pip install -r requirements.txt
```

Finally install the project in editable state

```console
pip3 install -e .
```

### Start the service

The KISP Web application and API service is implemented with [FastAPI](https://fastapi.tiangolo.com) and can be started as follow on default port `8050`:  

```console
python3 kisp/service.py --config my_config.yml
```

The application is then available for sign-in at http://localhost:8050/app/sign-in.html

### Use the service

Once the service is started as described in the previous sections, the web service API documnetation is available at `http(s)://*host*:*port*/docs`, e.g. for instance `http://localhost:8050/docs`, based on Swagger, and `http://localhost:8050/redoc` for ReDoc documentation style. These documentations offer interactive support to support test queries. 

## License

KISP is distributed under [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0). 

The documentation of the project is distributed under [CC-0](https://creativecommons.org/publicdomain/zero/1.0/) license and the possible annotated data under [CC-BY](https://creativecommons.org/licenses/by/4.0/) license.

If you contribute to the KISP project, you agree to share your contribution following these licenses. 

Contact: Patrice Lopez (<patrice.lopez@science-miner.com>)
