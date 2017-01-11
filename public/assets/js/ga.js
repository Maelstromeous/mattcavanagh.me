(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-15631800-15', 'auto');
ga('send', 'pageview');

$('.cv').on('click', function() {
    ga('send', {
        hitType: 'pageview',
        page: 'cv'
    });

    sendEvent('CV', $(this));
});

$('.github').on('click', function() {
    sendEvent('GitHub', $(this));
});

$('.twitter').on('click', function() {
    sendEvent('Twitter', $(this));
});

$('.email').on('click', function() {
    sendEvent('Email', $(this));
});

$('#portfolio-index .card .project-link').on('click', function() {
    sendEvent('Portfolio Link', $(this));
});

function sendGAEvent(category, context) {
    var location = $(context).data('location');

    ga('send', {
        hitType: 'event',
        eventCategory: category,
        eventAction: 'click',
        eventLabel: location
    });
}
