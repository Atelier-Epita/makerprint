import React from 'react';
import { useParams } from 'react-router-dom';
import Move from './Move';
import Status from './Status';
import styles from '../styles/PrinterPage.module.css';

export default function PrinterPage() {

    return (
        <div className="printer-page container">
            <Move />
            <Status />
        </div>
    );
}

