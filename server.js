'use strict'
const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000
const app = express();
const superagent = require('superagent');
const pg = require('pg');


app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));

// database setup
let client = '';

if(PORT == 3000 || PORT == 3030){
  client = new pg.Client(process.env.DATABASE_URL);
} else {
  client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
}

app.set('view engine','ejs');

app.get('/',(req,res)=>{
  let SQL = `SELECT * FROM books;`
  client.query(SQL)
  .then (result=>{
      // console.log(result.rows);
      countHandler().then(counter=>{
        res.render('./pages/index', { bookList: result.rows, total: counter })
       })
  })
});

app.get('/searches',(req,res)=>{
    res.render('./pages/searches/new');
})

app.post('/searches/new' , handleSearch);

//.......................................................
app.get('/books/:bookID',getDetails);
app.post('/addBooks', addBookHandler );

app.use('*', notFoundRoute );


// function

function countHandler() {
  let count = `SELECT COUNT(id) FROM books;`
  return client.query(count)
      .then(value => {
          return value.rows[0].count;
  })
}

  function handleSearch(req, res) {
    let searchWord = req.body.search;
    let searchWay = req.body.searchWay;

    let url = `https://www.googleapis.com/books/v1/volumes?q=+in${searchWay}:${searchWord}`;
    console.log(url);

    superagent.get(url).then (results => {

        let bookData = results.body.items;
                   
        let bookArr = bookData.map(value =>{

            const bookObject = new Book(value);
            return bookObject;
        })
        res.render('./pages/searches/show', {booksArray:bookArr});
    }).catch(()=>{
        res.status(500).render('./pages/error');
      });
  }

  function getDetails (req, res) {
    let SQL = `SELECT * from books WHERE id=$1;`;
    console.log(req.params);
    let value = [req.params.bookID];
    client.query(SQL,value)
    .then(result=>{
      // console.log(result.rows);
      res.render('pages/books/detail',{book:result.rows[0]})
    })
  }
  
  function addBookHandler (req, res){
    console.log(req.body);
    let SQL = `INSERT INTO books (author, title, isbn, image_url, description) VALUES ($1,$2,$3,$4,$5)RETURNING id;`;
    let value = req.body;
    let safeValues= [value.author,value.title,value.isbn,value.image_url,value.description];
    client.query(SQL,safeValues)
    .then((result)=>{
      console.log(result.rows);
      // res.redirect('/');
      res.redirect(`/books/${result.rows[0].id}`);

    })
  }

    function Book(data){
      this.title = data.volumeInfo.title;
      this.author = data.volumeInfo.authors;
      this.img = data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail:'https://i.imgur.com/J5LVHEL.jpg';
      this.description = data.volumeInfo.description ? data.volumeInfo.description : 'Description is not available';
      this.isbn = data.volumeInfo.industryIdentifiers[0].type + data.volumeInfo.industryIdentifiers[0].identifier;
      }

      function notFoundRoute(req,res){
        res.status(404).render('./pages/error');
      }
    
      client.connect().then(() => {
        app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
      })
