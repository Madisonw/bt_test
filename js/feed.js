
(function($,_,BB){
	/*
	 * Doing this with Backbone is a little contrived and perhaps over-the-top, 
	 * but I like creating new projects with it.
	 */
	
	/*  
	 * First we're going to set up our models and collections. :D
	 * We're going to declare them in ascending nested order for cascading's sake
	 * and so we're looking at our primals first.
	 * 
	 */
	var FeedEntry = BB.Model.extend({})
	
	var FeedEntryList = BB.Collection.extend({
		model : FeedEntry
	})
	
	var Feed = BB.Model.extend({
		
		initialize : function() {
			
			/*
			 * turning all the feed entries into the backbone model and putting them into a collection, 
			 * then setting that collection as an attibute on this model
			 */
			
			this.set("entries", new FeedEntryList());
		}
	})
	
	var FeedList = BB.Collection.extend({
		model : Feed
	})
	
	var list_of_feeds = new FeedList;
	
	/*
	 * Now we're going to declare our Views. Chyea!
	 */
	
	var FeedView = BB.View.extend({
		tagName : "section",
		template : _.template($("#FeedTemplate").html()),
		addEntry : function(entry) {
			var view = new EntryView({model: entry});
			var ele = this.$el.find("div.entry_container");
			this.entry_container.append(view.render().el);
		},
		render : function() {
			var modelEntries = this.model.get("entries");
			this.$el.html(this.template(this.model.toJSON()));
			this.entry_container = this.$el.find(".entry_container");
			_.each(this.model.attributes.entry,function(entry){
				modelEntries.add(new FeedEntry(entry));
			})
			return this;
		},
		initialize : function() {
			this.listenTo( this.model.get("entries") , "add" , this.addEntry );

		}
	})
	
	
	var EntryView = BB.View.extend({
		tagName : "li",
		template : _.template($("#EntryTemplate").html()),
		events : {
			"click" : "toggle_meta"
		},
		toggle_meta : function() {
			var animate_obj = {
				display: "block",
			}
			
			if (this.meta_open) {
				animate_obj.height = "0px";
				animate_obj.display = "none";
				animate_obj.overflow = "hidden";
				this.meta_open = false;
			} else {
				animate_obj.height = "200px";
				this.meta_container.css("overflow","auto");
				this.meta_open = true;
			}
			this.meta_container.animate(animate_obj);
		},
		render : function() {
			this.$el.html(this.template(this.model.toJSON()));
			this.meta_container = this.$el.find(".meta_container");
			return this;
		},
		initialize : function() {
			this.listenTo(this.model, "change", this.render);
			this.listenTo(this.model, "destroy", this.remove);
			this.meta_open = false;
		}
	})
	
	
	var FeedBrowser = BB.View.extend({
		el : $("#feeds"),
		currentTime : (new Date().getTime()),
		ONE_HOUR : 3600000,
		addFeed : function(feed) {
			var view = new FeedView({model: feed});
			this.$el.append(view.render().el);
		},
		addAllFeeds : function() {
			list_of_feeds.each( this.addFeed , this );
		},
		render : function(feedcontainer) {
			_.each(feedcontainer.value.items,function(feed){
				list_of_feeds.add(new Feed(feed));
			})
			return this;
		},
		initialize : function() {
			var that = this;
			this.listenTo( list_of_feeds , "add" , this.addFeed );
			/*
			 * Our client-side caching implementation. Pretty simple. Just checks if we have a cache,
			 * and if we do, if it expired (just set it arbitrarily to last an hour)
			 */
			if ((!window.localStorage) || (!window.localStorage.getItem("feedcontainer") || parseInt(window.localStorage.getItem("expiry"),10)<this.currentTime)) {
				//we need to get new data
				$.getJSON("http://pipes.yahoo.com/pipes/pipe.run?_id=f42c711ab0e64056fd200b38ad98e102&_render=json",function(results){
					that.render(results);
					
					window.localStorage.setItem("feedcontainer",JSON.stringify(results));
					window.localStorage.setItem("expiry",that.currentTime+that.ONE_HOUR);
				});
			} else {
				//we can just use the cached data
				this.render(JSON.parse(window.localStorage.getItem("feedcontainer")));
			}
		}
	})
	
	var App = new FeedBrowser;
	
	
}(jQuery,_,Backbone))





