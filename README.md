# Example REST API Server

This code was developed for use in the Cribl [REST API Sandbox](https://sandbox.cribl.io/course/rest). The various methods here simulate common discovery, collection, and pagination scenarios found in REST APIs.

## Usage

### Docker

You can run this application as a Docker container:

```shell
docker run -p "3000:3000" ghcr.io/bdalpe/rest-server
```

### Development

```shell
npm run dev
```

## Endpoints

### Utility

```text
GET /

It's a goat parade! 🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐
```

```
GET or POST /echo

{"headers":{"host":"localhost:3000","user-agent":"curl/7.77.0","accept":"*/*"},"body":{},"query":{}}
```

```
POST /login
Content-Type: application/json
{"username":"admin","password":"password"}

{"token":"eyJh...snip...to89dtY"}
```

### Authenticated

```
GET /private/test
Authorization: Bearer <token>

Success!
```

```
GET /private/array[?size=<int>]
Authorization: Bearer <token>

[{"id":1},{"id":2},{"id":3}]
```

### Discovery

```
GET /discover/object

{"id":1}
```

```
GET /discover/array[?size=<int>]

[{"id":1},{"id":2},{"id":3}]
```

Note: Optionally add `?size=<int>` to the URL to customize the number of objects returned.

### Collection

```
GET /collect/object/<int>

{"item":<int>}
```

```
GET /collect/array[?size=<int>]

[{"item":1},{"item":2},{"item":3},{"item":4},{"item":5}]
```

### Pagination

#### Limit/Offset

Parameters supported:
* `size` - total count of items
* `offset` - items from zero-indexed start
* `limit` - items returned per API call

```
GET /limit

{"items":[{"item":1},{"item":2},{"item":3},{"item":4},{"item":5}],"pagination":{"size":5,"limit":5,"offset":0,"total":25}}%
```

#### Page/Size

Parameters supported:
* `size` - total count of items
* `page` - zero-indexed page number
* `limit` - items returned per API call

```
GET /page

{"items":[{"item":1},{"item":2},{"item":3},{"item":4},{"item":5}],"pagination":{"size":5,"limit":5,"page":0,"total":25}}%
```

#### [RFC 5988](https://www.rfc-editor.org/rfc/rfc5988) Web Linking

Parameters supported:
* `size` - total count of items
* `limit` - items returned per API call

Semi-opaque parameters:
* `offset`

```
GET /linking

Link: </linking>; rel="self"
Link: </linking?size=25&limit=5&offset=5>; rel="next"

{"items":[{"item":1},{"item":2},{"item":3},{"item":4},{"item":5}],"pagination":{"size":5,"limit":5,"offset":0,"total":25}}
```

#### Response Body

Parameters supported:
* `size` - total count of items
* `limit` - items returned per API call

Semi-opaque parameters:
* `offset`

```
GET /response/body

{"items":[{"item":1},{"item":2},{"item":3},{"item":4},{"item":5}],"pagination":{"self":"/response/body","next":"/response/body?size=25&limit=5&offset=5"}}
```

#### Response Headers

Parameters supported:
* `size` - total count of items
* `limit` - items returned per API call

Semi-opaque parameters:
* `offset`

```
GET /response/headers

nextLink: /response/headers?size=25&limit=5&offset=5

{"items":[{"item":1},{"item":2},{"item":3},{"item":4},{"item":5}]}
```

#### Response Body (Has-more Expression)

Includes a pagination flag `more` to indicate if there are more pages to collect.

Parameters supported:
* `size` - total count of items
* `limit` - items returned per API call

Semi-opaque parameters:
* `offset`

```
GET /response/body

{"items":[{"item":1},{"item":2},{"item":3},{"item":4},{"item":5}],"pagination":{"offset":5,"more":true}}
```
