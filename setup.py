from setuptools import setup

setup(
    name='makerprint',
    author='L\'Atelier <tech@atelier-maker.fr>',
    version='0.1',
    py_modules=['makerprint'],
    install_requires=[
        "pyserial",
        "flask",
        "flask-cors",
        "environs",
    ],
    extras_require={
        'dev': [
            'pytest',
            'pytest-cov',
            'black',
            'flake8',
        ],
    },
)