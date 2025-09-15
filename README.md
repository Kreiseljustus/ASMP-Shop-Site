# ASMP Shops & Waytones

A web application for tracking Minecraft shops and waystones across different dimensions. Built with Node.js and Express.
## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Open `http://localhost:49876` in your browser

## Configuration

- Edit `news.json` to manage server announcements
- Modify `ignoredShops.json` and `ignoredWaystones.json` to filter data
- Update `info.html` to customize the about page

## API Endpoints

- `GET /asmp/api/shops` - Get all shop data
- `GET /asmp/api/waystones` - Get all waystone data  
- `POST /asmp/post` - Submit new shop/waystone data (for mod integration)

## Contributing

Fork the project, make your changes, and open a pull request!

## License

ISC License - see package.json for details