import React, { createContext, useContext, useReducer, useEffect } from "react";

export const initialState = {
    printers: [],
    files: [],
    printerName: null,
    fileName: null,
    status: {
        connected: false,
        port: null,
        baud: -1,
        printing: false,
        paused: false,
        progress: 0,
    },
    error: (200, null),
};

export const ACTIONS = {
    SET_PRINTERS: "SET_PRINTERS",
    SET_PRINTER_NAME: "SET_PRINTER_NAME",
    SET_FILES: "SET_FILES",
    SET_FILE_NAME: "SET_FILE_NAME",
    SET_PRINTER_STATUS: "SET_PRINTER_STATUS",
    SET_ERROR: "SET_ERROR",
};

const reducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_PRINTERS:
            return { ...state, printers: action.payload };
        case ACTIONS.SET_PRINTER_NAME:
            return { ...state, printerName: action.payload };
        case ACTIONS.SET_FILES:
            return { ...state, files: action.payload };
        case ACTIONS.SET_FILE_NAME:
            return { ...state, fileName: action.payload };
        case ACTIONS.SET_PRINTER_STATUS:
            return { ...state, status: action.payload };
        case ACTIONS.SET_ERROR:
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

const UserContext = createContext();
export const useUserContext = () => useContext(UserContext);
export const UserProvider = ({ children }) => {
    // localStorage.clear(); // Uncomment to clear localStorage

    const storedState = JSON.parse(localStorage.getItem("userState")) || initialState;
    const [state, dispatch] = useReducer(reducer, storedState);

    useEffect(() => {
        // Store the state in localStorage whenever it changes
        localStorage.setItem("userState", JSON.stringify(state));
    }, [state]);

    return (
        <UserContext.Provider value={[state, dispatch]}>
            {children}
        </UserContext.Provider>
    );
};
