import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import "./App.css";

function App() {
  const cities = [
    "Tokyo",
    "Lagos",
    "New-York",
    "Sao Paolo",
    "Mexico City",
    "London",
    "Los Angeles",
    "Casablanca",
    "Athens",
    "Geneva",
    "Yaounde",
    "Ibadan",
    "Beijing",
    "Oslo",
    "Caracas",
    "Paris",
    "Jerusalem",
    "Dubai",
    "Riyadh",
    "Amsterdam",
  ];
  const base = "https://api.mapbox.com/geocoding/v5/mapbox.places";
  const weathertoken = "a1ced4043f78b416c057b9d32d9a0645";
  mapboxgl.accessToken =
    "pk.eyJ1Ijoib2x1c2V1bmFraW4iLCJhIjoiY2xmZ3IxNzNoM2JreDN5cGMxaDNjempsbyJ9.ICuQOrMYTlYlpKod--v0yA";
  const mapContainerRef = useRef(null);
  const mapRef = useRef<mapboxgl.Map>();
  const [searched, setSearched] = useState(cities);
  const location = window.navigator.geolocation;
  let center: mapboxgl.LngLatLike | undefined | any | Array<number>;
  const [outsideDiv, setOutsideDiv] = useState("");

  async function checkWeather(center: Array<number>) {
    const weatherurl = `https://api.openweathermap.org/data/2.5/forecast?lat=${center[1]}&lon=${center[0]}&cnt=16&appid=${weathertoken}&units=metric`;
    const weatherJSON = await (await fetch(weatherurl)).json();
    const weatherlist = [weatherJSON.list[0], weatherJSON.list[8]];
    let internal = `<div>`;
    weatherlist.forEach(
      (mainweather: {
        weather: { main: any }[];
        main: { temp: any; humidity: any; pressure: any };
        wind: { speed: any };
        dt_txt: any;
      }) => {
        const weatherDiv = `<div>
                            <p>${mainweather.dt_txt}</p>
                            <h1>${mainweather.weather[0].main}</h1>
                            <h2>Temperature ${mainweather.main.temp}C</h2>
                            <div>
                              <span>Wind Speed ${mainweather.wind.speed}</span>
                              <span>Humidity ${mainweather.main.humidity}</span>
                              <span>Pressure ${mainweather.main.pressure}</span>
                            </div>
                          </div>`;
        internal += weatherDiv;
      }
    );
    internal += "</div>";
    return internal;
  }

  function addPopup(center: Array<number>) {
    return new mapboxgl.Popup({
      offset: 10,
      maxWidth: "none",
      className: "popups",
    })
      .setLngLat([center[0], center[1]])
      .setHTML(outsideDiv);
  }

  function addTag(
    center: Array<number>,
    mapRef: React.MutableRefObject<mapboxgl.Map | undefined>
  ) {
    const info = document.createElement("div");
    info.className = "info";
    new mapboxgl.Marker(info)
      .setLngLat([center[0], center[1]])
      .setPopup(addPopup(center))
      .addTo(mapRef.current!);
  }


  useEffect(() => {
    if (location) {
      location.getCurrentPosition(
        async (position: GeolocationPosition) => {
          center = [position.coords.longitude, position.coords.latitude];
          const internal = await checkWeather(center);
          createMap();
          setOutsideDiv(internal);
        },
        async () => {
          center = [-74.5, 40];
          const internal = await checkWeather(center);
          createMap();
          setOutsideDiv(internal);
        }
      );
    }
  }, [outsideDiv]);

  function createMap() {
    addTag(center, mapRef);
    if (mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 9,
    });
  }

  return (
    <div className="appdiv">
      <aside>
        <div>
          <input
            type="search"
            onChange={(e) => {
              const search = e.currentTarget.value;
              const searchRegex = new RegExp(search, "i");
              const citiess = cities
                .map((city) => city.match(searchRegex))
                .filter((city) => city !== null)
                .map((city) => city!.input!);
              setSearched(citiess);
            }}
          />
        </div>
        <ul>
          {searched.map((city, i) => (
            <li key={i}>
              <button
                onClick={async (e) => {
                  const place = e.currentTarget.innerText;
                  const url = `${base}/${encodeURIComponent(
                    place
                  )}.json?access_token=${mapboxgl.accessToken}`;
                  const d = await (await fetch(url)).json();
                  const center = d.features[0].center;
                  mapRef.current!.flyTo({ center });
                  mapRef.current!.on("moveend", async () => {
                    addTag(center, mapRef);
                    checkWeather(center);
                  });
                }}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="mapContainer">
        <div ref={mapContainerRef}></div>
      </main>
    </div>
  );
}

export default App;
