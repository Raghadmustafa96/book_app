'use strict'
const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000
const app = express();
const superagent = require('superagent');


app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));


app.set('view engine','ejs');

app.get('/',(req,res)=>{
   res.render('./pages/index');
});

app.get('/searches/new',(req,res)=>{
    res.render('./pages/searches/new');
})

app.get('/searches/show' , handleSearch);

app.use('*', notFoundRoute );

  function handleSearch(req, res) {
    let searchWord = req.query.search;
    let searchWay = req.query.searchWay;

    let url = `https://www.googleapis.com/books/v1/volumes?q=${searchWord}+in${searchWay}`;
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

  function Book(data){
      this.title = data.volumeInfo.title;
      this.author = data.volumeInfo.authors;
      this.img = data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail:'https://i.imgur.com/J5LVHEL.jpg';
      }

      function notFoundRoute(req,res){
        res.status(404).render('./pages/error');
      }
    
app.listen(PORT,()=>{
    console.log(`Listening on PORT ${PORT}`)
})
