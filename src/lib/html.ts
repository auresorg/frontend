export const NOT_FOUND_HTML = `
<html>
<head>
<title>Resume Not Found</title>
<style>
body {
    margin: 0;
    padding: 0;
    background: #f8fbff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
}
.card {
    background: white;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    text-align: center;
    max-width: 340px;
}
h1 {
    margin: 0 0 12px 0;
    color: #2563eb;
    font-size: 24px;
    font-weight: 600;
}
p {
    margin: 0;
    color: #4b5563;
    font-size: 16px;
    line-height: 1.5;
}
.footer {
    margin-top: 20px;
    font-size: 14px;
    color: #9ca3af;
}
</style>
</head>
<body>
<div class="card">
    <h1>Resume Not Found</h1>
    <p>The resume you're looking for doesn't exist or has been removed.</p>
    <p class="footer">HTTP ERROR 404</p>
</div>
</body>
</html>
`;

export const ERROR_HTML = `
<html>
<head>
<title>Failed to Load Resume</title>
<style>
body {
    margin: 0;
    padding: 0;
    background: #f8fbff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
}
.card {
    background: white;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    text-align: center;
    max-width: 340px;
}
h1 {
    margin: 0 0 12px 0;
    color: #dc2626;
    font-size: 24px;
    font-weight: 600;
}
p {
    margin: 0;
    color: #4b5563;
    font-size: 16px;
    line-height: 1.5;
}
.footer {
    margin-top: 20px;
    font-size: 14px;
    color: #9ca3af;
}
</style>
</head>
<body>
<div class="card">
    <h1>Something Went Wrong</h1>
    <p>We couldn't load your resume right now. Please try again later.</p>
    <p class="footer">HTTP ERROR 500</p>
</div>
</body>
</html>
`;

export const INVALID_REQUEST_HTML = `
<html>
<head>
<title>Invalid Request</title>
<style>
body {
    margin: 0;
    padding: 0;
    background: #f8fbff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
}
.card {
    background: white;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    text-align: center;
    max-width: 340px;
}
h1 {
    margin: 0 0 12px 0;
    color: #f59e0b;
    font-size: 24px;
    font-weight: 600;
}
p {
    margin: 0;
    color: #4b5563;
    font-size: 16px;
    line-height: 1.5;
}
.footer {
    margin-top: 20px;
    font-size: 14px;
    color: #9ca3af;
}
</style>
</head>
<body>
<div class="card">
    <h1>Invalid Request</h1>
    <p>The resume link you're trying to access is invalid.</p>
    <p class="footer">HTTP ERROR 400</p>
</div>
</body>
</html>
`;