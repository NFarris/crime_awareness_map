from flask import Flask, render_template
from flask import request
from flask import jsonify
from arcgis.gis import GIS
from arcgis.features import FeatureLayer
from arcgis.features import FeatureSet


app = Flask(__name__, static_url_path='')
KEY = '73a7540674ff44e3b243e5b8e63c9a15'


@app.route("/")
def home():
    return render_template('home.html')


@app.route("/about/")
def about():
    return render_template('about.html')


@app.route("/key")
def index():
    r = {"mapKey": KEY}
    return jsonify(r)


@app.route('/submit', methods=['POST'])  # GET requests will be blocked
def submit():
    req_data = request.get_json(force=True)
    append_geo_json(req_data)
    return "Submitted"


def append_geo_json(geo_json):
    gis = GIS("https://www.arcgis.com", username="", password="")
    crime_properties = {
        'title': 'Crime data',
        'tags': 'crimes, open data, devlabs',
        'type': 'GeoJson'
    }

    search_result = gis.content.search(query="", item_type="Feature Layer")
    crime_data_item = search_result[0]
    crime_data_feature_layer = FeatureLayer.fromitem(
        crime_data_item, layer_id=0)
    new_crime_set = FeatureSet.from_geojson(geo_json)
    crime_data_feature_layer.edit_features(adds=new_crime_set)
