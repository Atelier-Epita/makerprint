from setuptools import setup

setup(
    name='makerprint',
    author='L\'Atelier <tech@atelier-maker.fr>',
    version='0.1',
    python_requires='>=3.8',
    packages=['makerprint'],
    install_requires=[
        "pyserial",
        "fastapi",
        "python-multipart",
        "environs",
        "Printrun",
        "hypercorn",
    ],
    extras_require={
        'dev': [
            'pytest',
            'pytest-cov',
            'black',
            'flake8',
        ],
    },
    entry_points={
        'console_scripts': [
            'makerprint = makerprint.main:main',
        ],
    },
)