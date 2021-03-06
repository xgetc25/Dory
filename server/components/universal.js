import React from 'react';
import { Provider } from 'react-redux';
import { renderToString } from 'react-dom/server';
import DocumentTitle from 'react-document-title';
import { render } from 'mustache';
import { createStore, applyMiddleware } from 'redux';
import { RouterContext, match } from 'react-router';
import { Base64 } from 'js-base64';
import createLocation from 'history/lib/createLocation';
import getRoutes from '../../public/js/config/routes';
import reducers from '../../public/js/reducers';
import promise from '../../public/js/utilities/middleware';

/**
 * @constant ERRORS
 * @type {Object}
 */
const ERRORS = { 404: 'Not found.', 500: 'Internal server error.' };

/**
 * @param {Object} options
 * @return {Function}
 */
export default options => {

    const documentHtml = options.fromCore('/index.html');

    return (request, response) => {

        const location = createLocation(request.url);
        const createStoreWithMiddleware = applyMiddleware(promise)(createStore);
        const store = createStoreWithMiddleware(reducers);

        match({ routes: getRoutes(store), location }, (error, redirectLocation, renderProps) => {

            /**
             * @constant statusCode
             * @type {Number|false}
             */
            const statusCode = (() => {
                if (error) return 500;
                if (!renderProps) return 400;
                return false;
            })();

            if (statusCode) {

                // Determine if we have a different status code to yield.
                return response.status(statusCode).end(ERRORS[statusCode]);

            }

            /**
             * @constant InitialComponent
             * @type {XML}
             */
            const InitialComponent = (
                <Provider store={store}>
                    <RouterContext {...renderProps} />
                </Provider>
            );

            try {

                // Render the HTML using the components determined by the React router.
                const componentHtml = renderToString(InitialComponent);

                response.end(render(documentHtml, {
                    content: componentHtml,
                    title: DocumentTitle.rewind(),
                    data: Base64.encode(JSON.stringify(store.getState()))
                }));

            } catch (e) {
                console.log('Error!', e);
            }

        });

    }

};
