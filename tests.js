const chai = require('chai')
const chaiHttp = require('chai-http');
const app = require('./server');

chai.use(chaiHttp);
chai.should();

describe("Basic", () => {
    describe("GET /", () => {
        it("should get the goat parade", () => {
            chai.request(app)
                .get("/")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.text.should.be.equal("It's a goat parade! 🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐🐐")
                })
        })
    })

    describe("Undefined paths", () => {
        it("should 404", () => {
            chai.request(app)
                .get("/a/path/that/doesnt/exist")
                .end((err, res) => {
                    res.should.have.status(404);
                })
        })
    })
})

describe("Echo", () => {
    describe("GET /echo", () => {
        it("should return the sent data", () => {
            chai.request(app)
                .get("/echo")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("headers")
                    res.body.should.have.property("body");
                    res.body.body.should.be.deep.equal({});
                    res.body.should.have.property("query");
                    res.body.query.should.be.deep.equal({});
                })
        })

        it("should have query strings", () => {
            chai.request(app)
                .get("/echo?test=1234")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("query");
                    res.body.query.should.be.deep.equal({test: "1234"});
                })
        })
    })

    describe("POST /echo", () => {
        it("should have post body data", () => {
            chai.request(app)
                .post("/echo")
                .set("content-type", "application/json")
                .send({data: "body"})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.body.should.have.property("data");
                    res.body.body.should.be.deep.equal({data: "body"});
                    res.body.headers.should.have.property("content-type");
                    res.body.headers['content-type'].should.be.equal("application/json");
                })
        })
    })
})

describe("Discovery", () => {
    describe("GET /discover/object", () => {
        it("should be an object", () => {
            chai.request(app)
                .get("/discover/object")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.deep.equal({id: 1});
                })
        })
    })

    describe("GET /discover/array", () => {
        it("should return an array of size 3", () => {
            chai.request(app)
                .get("/discover/array")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.deep.equal([{id: 1}, {id: 2}, {id: 3}]);
                })
        })

        it("should return size 5 when size is specified", () => {
            chai.request(app)
                .get("/discover/array?size=5")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.lengthOf(5);
                    res.body.should.be.deep.equal([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}])
                })
        })

        it("should reject invalid input with 400", () => {
            chai.request(app)
                .get("/discover/array?size=f")
                .end((err, res) => {
                    res.should.have.status(400);
                })
        })

        it("should reject if less than zero with 400", () => {
            chai.request(app)
                .get("/discover/array?size=-1")
                .end((err, res) => {
                    res.should.have.status(400);
                })
        })
    })
})

describe("Static Collection", () => {
    describe("GET /collect/object/:id", () => {
        it("should return the object id", () => {
            chai.request(app)
                .get("/collect/object/1")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.deep.equal({item: 1});
                })
        })

        it('should return 404 if invalid object id', () => {
            chai.request(app)
                .get("/collect/object/f")
                .end((err, res) => {
                    res.should.have.status(404);
                })
        })

        it('should only return positive ids', () => {
            chai.request(app)
                .get("/collect/object/-1")
                .end((err, res) => {
                    res.should.have.status(404);
                })
        })
    })

    describe("GET /collect/array", () => {
        it("should return an array of size 5 by default", () => {
            chai.request(app)
                .get("/collect/array")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an("array");
                    res.body.should.be.lengthOf(5);
                    res.body.should.deep.equal([{item: 1}, {item: 2}, {item: 3}, {item: 4}, {item: 5}])
                })
        })

        it("should be of size 25 when requested", () => {
            chai.request(app)
                .get("/collect/array?size=25")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an("array");
                    res.body.should.be.lengthOf(25);
                })
        })
    })
})

describe("Authentication", () => {
    let token;

    describe("Login", () => {
        it("should fail login with bad password", () => {
            chai.request(app)
                .post('/login')
                .set("Content-Type", "application/json")
                .send({username: "admin", password: "badpass"})
                .end((err, res) => {
                    res.should.have.status(401);
                })
        })

        it("should login successfully", () => {
            chai.request(app)
                .post('/login')
                .set("Content-Type", "application/json")
                .send({username: "admin", password: "password"})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.header.should.have.property("content-type")
                    res.body.should.have.property("token")

                    token = res.body.token;
                })
        })
    })

    describe("GET /private/test", () => {
        it("should prevent unauthorized users", () => {
            chai.request(app)
                .get("/private/test")
                .end((err, res) => {
                    res.should.have.status(401);
                })
        })

        it("should reject invalid bearer tokens", () => {
            chai.request(app)
                .get("/private/test")
                .set("Authorization", `Bearer notvalid`)
                .end((err, res) => {
                    res.should.have.status(401);
                })
        })
        it("should be able to access private resources", () => {
            chai.request(app)
                .get("/private/test")
                .set("Authorization", `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.text.should.be.equal("Success!");
                })
        })

        it("should return an array when authenticated", () => {
            chai.request(app)
                .get("/private/array")
                .set("Authorization", `Bearer ${token}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.lengthOf(5);
                })
        })

        it("should work without the Bearer prefix", () => {
            chai.request(app)
                .get("/private/test")
                .set("Authorization", token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.text.should.be.equal("Success!");
                })
        })
    })
})

describe("Pagination", () => {
    describe("GET /limit", () => {
        it("should get the first offset", () => {
            chai.request(app)
                .get("/limit")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('pagination');
                    res.body.pagination.should.be.deep.equal({
                        size: 5,
                        limit: 5,
                        offset: 0,
                        total: 25
                    })
                })
        })

        it("should return the updated second offset", () => {
            chai.request(app)
                .get("/limit?offset=5")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('pagination');
                    res.body.pagination.should.be.deep.equal({
                        size: 5,
                        limit: 5,
                        offset: 5,
                        total: 25
                    })
                })
        })

        it("should change the size if the limit is changed", () => {
            chai.request(app)
                .get("/limit?limit=2")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('pagination');
                    res.body.pagination.should.be.deep.equal({
                        size: 2,
                        limit: 2,
                        offset: 0,
                        total: 25
                    })
                })
        })

        it("should return 400 if not valid size", () => {
            chai.request(app)
                .get("/limit?size=f")
                .end((err, res) => {
                    res.should.have.status(400);
                })
        })

        it("should return 400 if not valid limit", () => {
            chai.request(app)
                .get("/limit?limit=f")
                .end((err, res) => {
                    res.should.have.status(400);
                })
        })

        it("should return 400 if not valid offset", () => {
            chai.request(app)
                .get("/limit?offset=f")
                .end((err, res) => {
                    res.should.have.status(400);
                })
        })
    })

    describe("GET /page", () => {
        it("should return the first page information", () => {
            chai.request(app)
                .get("/page")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('pagination');
                    res.body.pagination.should.be.deep.equal({
                        size: 5,
                        limit: 5,
                        page: 0,
                        total: 25
                    })
                })
        });

        it("should return the updated second page", () => {
            chai.request(app)
                .get("/page?page=1")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('pagination');
                    res.body.pagination.should.be.deep.equal({
                        size: 5,
                        limit: 5,
                        page: 1,
                        total: 25
                    });
                });
        });

        it("should change the size if the limit is changed", () => {
            chai.request(app)
                .get("/page?limit=2")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('pagination');
                    res.body.pagination.should.be.deep.equal({
                        size: 2,
                        limit: 2,
                        page: 0,
                        total: 25
                    })
                })
        })

        it("should return 400 if not valid size", () => {
            chai.request(app)
                .get("/page?page=f")
                .end((err, res) => {
                    res.should.have.status(400);
                });
        });

        it("should return 400 if not valid limit", () => {
            chai.request(app)
                .get("/page?page=f")
                .end((err, res) => {
                    res.should.have.status(400);
                });
        });

        it("should return 400 if not valid page number", () => {
            chai.request(app)
                .get("/page?page=f")
                .end((err, res) => {
                    res.should.have.status(400);
                });
        });
    });

    describe("GET /linking", () => {
        it("should return a header with the next page", () => {
            chai.request(app)
                .get("/linking")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.header.should.have.property("link")
                    res.header.link.should.contain('</linking>; rel="self"');
                    res.header.link.should.contain('</linking?size=25&limit=5&offset=5>; rel="next"');
                })
        })

        it("should update the header with the next page", () => {
            chai.request(app)
                .get("/linking?size=25&limit=5&offset=5")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.header.should.have.property("link")
                    res.header.link.should.contain('</linking?size=25&limit=5&offset=5>; rel="self"');
                    res.header.link.should.contain('</linking?size=25&limit=5&offset=10>; rel="next"');
                })
        })
    })

    describe("GET /response/body", () => {
        it("should return a pagination object in the response", () => {
            chai.request(app)
                .get("/response/body")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("pagination")
                    res.body.pagination.next.should.be.equal("/response/body?size=25&limit=5&offset=5")
                })
        })

        it("should update the pagination object", () => {
            chai.request(app)
                .get("/response/body?size=25&limit=5&offset=5")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("pagination")
                    // res.body.pagination
                })
        })

        it("should update the pagination object", () => {
            chai.request(app)
                .get("/response/body?size=25&limit=5&offset=20")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("pagination")
                    res.body.pagination.should.not.have.property("next")
                })
        })
    })

    describe("GET /response/headers", () => {
        it("should return pagination details in the response headers", () => {
            chai.request(app)
                .get("/response/headers")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.header.should.have.property("nextlink")
                })
        })

        it("should add the previous link", () => {
            chai.request(app)
                .get("/response/headers?size=25&limit=5&offset=5")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.header.should.have.property("previouslink")
                    res.header.previouslink.should.be.equal("/response/headers?size=25&limit=5&offset=0")
                })
        })

        it("should not have next link on the last page", () => {
            chai.request(app)
                .get("/response/headers?size=25&limit=5&offset=20")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.header.should.not.have.property("nextlink")
                })
        })
    })
})

describe("Last-Page Expression Pagination", () => {
    describe("GET /response/body/more", () => {
        it("should return a default", () => {
            chai.request(app)
                .get("/response/body/more")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("pagination");
                    res.body.pagination.should.have.property("next");
                    res.body.pagination.next.should.equal(5);
                    res.body.pagination.should.have.property("more");
                    res.body.pagination.more.should.equal(true);
                })
        })

        it("more should return false when reaching limit", () => {
            chai.request(app)
                .get("/response/body/more?offset=22")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("pagination");
                    res.body.pagination.should.have.property("more");
                    res.body.pagination.more.should.equal(false);
                })
        })

        it("should return 400 if invalid offset", () => {
            chai.request(app)
                .get("/response/body/more?offset=-1")
                .end((err, res) => {
                    res.should.have.status(400);
                })
        })
    })
});