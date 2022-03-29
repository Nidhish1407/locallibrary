const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let GenreSchema = new Schema(
    {
        name:{type:String,required:true,minlength:3,maxlength:100},
    }
) 

GenreSchema.
virtual('url').
get(function(){
    return '/catalog/genre/' + this.id;
})

//Export model
module.exports = mongoose.model('Genre',GenreSchema);