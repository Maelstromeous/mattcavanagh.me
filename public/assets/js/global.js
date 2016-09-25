$('[data-toggle="tooltip"]').tooltip();
$('[data-toggle="tab"]').click(function (e) {
    e.preventDefault()
    $(this).tab('show');
});
