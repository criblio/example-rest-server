const express = require('express');
const logger = require('morgan');
const jwt = require('jsonwebtoken')
const app = express();
app.use(express.json());
app.use(logger('dev'));

const JWT_SECRET = process.env.JWT_SECRET || 'cribl';

const requireValidJWT = (req, res, next) => {
    if (req.headers?.authorization) {
        // Trim "Bearer" preamble
        let tok = req.headers.authorization.match(/^Bearer /i) ? req.headers.authorization.substring(7) : req.headers.authorization

        try {
            jwt.verify(tok, JWT_SECRET, {}, undefined);
            return next();
        } catch {}
    }

    res.status(401).send('Unauthorized');
}

const genArrayOfObjects = (count, name = "item") => {
    return [...Array(count)].map((value, index) => ({[name]: index + 1}));
}

app.get('/', (req, res) => res.send(`It's a goat parade! ${'🐐'.repeat(20)}`));

const echo = (req, res) => res.json({headers: req.headers, body: req.body, query: req.query});

app.get('/echo', echo);
app.post('/echo', echo);

app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (username === 'admin' && password === 'password') {
        let token = jwt.sign({}, JWT_SECRET, {subject: username, expiresIn: "300s"}, undefined);
        res.send({token});
    } else {
        res.status(401).send('Unauthorized');
    }
});

// Static object with one attribute
app.get('/discover/object', (req, res) => res.json({id: 1}));

const validateNumber = (num) => {
    if (num === undefined) return undefined;

    if (!Number.isInteger(+num)) throw new Error("NaN");
    if (num < 0) throw new Error("Negative number");

    return +num;
}

const validateSize = (req, res, next, size) => {
    try {
        res.locals.size = validateNumber(req.query.size) || size;

        return next();
    } catch {}

    res.status(400).send('Bad request');
}

app.get('/discover/array', (req, res, next) => {
    validateSize(req, res, next, 3);
}, (req, res) => {
    res.json(genArrayOfObjects(res.locals.size, "id"));
});

app.get('/collect/object/:id([0-9]+)', (req, res) => {
    res.json({item: +req.params.id});
});

// TODO: Basic Auth endpoints - something like this https://stackoverflow.com/a/33905671

app.get('/private/test', requireValidJWT, (req, res) => {
    res.send('Success!');
});

app.get('/private/array', requireValidJWT, (req, res, next) => {
    validateSize(req, res, next, 5);
}, (req, res) => {
    res.json(genArrayOfObjects(res.locals.size));
});

app.get('/collect/array', (req, res, next) => {
    validateSize(req, res, next, 5);
}, (req, res) => {
    res.json(genArrayOfObjects(res.locals.size));
});

const paginationMiddleware = (req, res, next) => {
    // Set sane defaults if not specified
    try {
        res.locals.size = validateNumber(req.query.size) || 25;
        res.locals.limit = validateNumber(req.query.limit) || 5;
        res.locals.offset = validateNumber(req.query.offset) || 0;
        res.locals.page = validateNumber(req.query.page) || 0

        return next();
    } catch {}

    res.status(400).send('Bad request');
}

const getPreviousPageLink = (req, size, limit, offset) => `${req.path}?size=${size}&limit=${limit}&offset=${Math.max(0, offset - limit)}`;
const getNextPageLink = (req, size, limit, offset) => `${req.path}?size=${size}&limit=${limit}&offset=${offset + limit}`;

const generateOffsetPaginatedArray = (size, offset, limit, offsetName = "offset") => {
    let generated = genArrayOfObjects(size).slice(offset, offset + limit);
    return {items: generated, pagination: {size: generated.length, limit: limit, [offsetName]: offsetName === "offset" ? offset : offset / limit, total: size}};
}

app.get('/limit', paginationMiddleware, (req, res) => {
    res.json(generateOffsetPaginatedArray(res.locals.size, res.locals.offset, res.locals.limit));
});

app.get('/page', paginationMiddleware, (req, res) => {
    res.json(generateOffsetPaginatedArray(res.locals.size, res.locals.page * res.locals.limit, res.locals.limit, "page"));
});

app.get('/linking', paginationMiddleware, (req, res) => {
    res.append('Link', [`<${req.url}>; rel="self"`]);
    (res.locals.offset > 0) && res.append('Link', [`<${getPreviousPageLink(req, res.locals.size, res.locals.limit, res.locals.offset)}>; rel="previous"`]);
    (res.locals.offset + res.locals.limit < res.locals.size) && res.append('Link', [`<${getNextPageLink(req, res.locals.size, res.locals.limit, res.locals.offset)}>; rel="next"`]);

    res.json(generateOffsetPaginatedArray(res.locals.size, res.locals.offset, res.locals.limit));
});

app.get('/response/body', paginationMiddleware, (req, res) => {
    res.json({
        items: genArrayOfObjects(res.locals.size).slice(res.locals.offset, res.locals.offset + res.locals.limit),
        pagination: {
            self: req.url,
            next: res.locals.offset + res.locals.limit < res.locals.size ? getNextPageLink(req, res.locals.size, res.locals.limit, res.locals.offset) : undefined,
            previous: res.locals.offset > 0 ? getPreviousPageLink(req, res.locals.size, res.locals.limit, res.locals.offset) : undefined
        }
    });
});

app.get('/response/body/more', paginationMiddleware, (req, res) => {
   res.json({
       items: genArrayOfObjects(res.locals.size).slice(res.locals.offset, res.locals.offset + res.locals.limit),
       pagination: {
           next: res.locals.offset + res.locals.limit,
           more: res.locals.offset + res.locals.limit < res.locals.size,
       }
   })
});

app.get('/response/headers', paginationMiddleware, (req, res) => {
    (res.locals.offset > 0) && res.append('previousLink', getPreviousPageLink(req, res.locals.size, res.locals.limit, res.locals.offset));
    (res.locals.offset + res.locals.limit < res.locals.size) && res.append('nextLink', getNextPageLink(req, res.locals.size, res.locals.limit, res.locals.offset));
    res.json({items: genArrayOfObjects(res.locals.size).slice(res.locals.offset, res.locals.offset + res.locals.limit)});
});

// 404 handler
app.all('*', (req, res) => res.status(404).send('Not found'));

module.exports = app;