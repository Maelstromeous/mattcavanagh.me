$(document).ready(function() {
    // Init the grids
    $('.card-grid').masonry({
        columnWidth: '.col-sm-6',
        itemSelector: '.col-sm-6',
    });

    doGrid('#all');

    $('.nav li a').on('shown.bs.tab', function() {
        var grid = $(this).attr('href');
        doGrid(grid);
    });

    $('.card.preview').on('click', function() {
        var link = $(this).data('href');
        if (link && link !== undefined) {
            window.location.assign(link);
        } else {
            //alert('Sorry, the details page of this project is not available.');
        }
    });

    $('#all-techs-button').click(function() {
        var open = $(this).attr('data-open');

        if (open == 0) {
            $('#all-techs').slideDown();
            $(this).find('span').html('<i class="fa fa-compress"></i> Hide');
            $(this).attr('data-open', 1);
        } else {
            $('#all-techs').slideUp();
            $(this).find('span').html('<i class="fa fa-expand"></i> Show all technologies');
            $(this).attr('data-open', 0);
        }
    });
});

// Prompts the grids to do a layout just in case anything messed up
function doGrid(selector) {
    $(selector + ' .card-grid').imagesLoaded().done(function() {
        $(selector + ' .card-grid').masonry('layout');

        // Hack to do the layout twice, because masonry for some
        // odd reason doesn't do a proper job??
        setTimeout(function() {
            $(selector + ' .card-grid').masonry('layout');
        }, 50);
    });
}
