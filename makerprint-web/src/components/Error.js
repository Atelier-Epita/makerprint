import React, { useEffect } from 'react';
import { useUserContext, ACTIONS } from '../UserContext';

function Error() {
    const [state, dispatch] = useUserContext();
    useEffect(() => {
        setTimeout(() => {
            dispatch({ type: ACTIONS.SET_ERROR, payload: null });
        }, 5000);
    }, [state.error, dispatch]);

    if (!state.error || state.error[0] === 200) {
        return (
            <div className="error-container hidden-container">
            </div>
        );
    }

    return (
        <div className="error-container visible-container">
            <div className="error-message">
                <h2>Error</h2>
                <p>{state.error[0]}: {state.error[1]}</p>
            </div>
        </div>
    );

}

export default Error;