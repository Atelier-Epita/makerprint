import React from 'react';
import { useParams } from 'react-router-dom';
import Move from './Move';
import Status from './Status';
import FilesList from './FilesList';
import styles from '../styles/PrinterPage.module.css';

export default function PrinterPage() {

    return (
        <div className="printer-page container">
            <Move />
            <Status />
            <FilesList />
        </div>
    );
}

