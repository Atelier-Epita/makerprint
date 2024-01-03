from . import api 

import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--config", default="makerprint.env")
parser.add_argument("--debug", action="store_true")
args = parser.parse_args()

api.run(args.config, args.debug)
