const PEOPLE = [
    {name:'Ping', age: 20},
    {name:'Amir', age: 24},
    {name:'Shabnum', age: 30 },
    {name: 'Mark', age: 40}
  ]
  
  new Vue({
    el:"#app",
    data: {
      searchDetails: '',
      reverse: false,
      people: PEOPLE
    },
    methods: {
      getKey: function(key){
       this.reverse = ! this.reverse
       if(key==='name' && this.reverse){
         this.people = _.orderBy(this.people, ['name'], ['asc'])
       }else if(key==='name' && !this.reverse){
         this.people = _.orderBy(this.people, ['name'], ['desc'])
       }else if(key==='age' && this.reverse){
         this.people = _.orderBy(this.people, ['age'], ['asc'])
       }else{
         this.people = _.orderBy(this.people, ['age'], ['desc'])
       }
      }
    },
    computed: {
      
      
      filterIt: function(){
        
         if(_.isString(this.searchDetails)){
          return this.filterPeopleByName;
         }else{
           return this.filterPeopleByAge;
         }
      },
      
      filterPeopleByName: function(){
        var self = this
            return this.people.filter(function(p){
              return p.name.indexOf(self.searchDetails) > - 1
            })  
        
       },
      filterPeopleByAge: function(){
        var self = this
            return this.people.filter(function(p){
              var age = p.age.toString()
              return age.indexOf(self.searchDetails) > - 1
            })  
      }
      
    }
  })