document.addEventListener("DOMContentLoaded", () => {

  const startBtn = document.getElementById("startBtn")
  const cancelBtn = document.getElementById("cancelBtn")
  const statusText = document.getElementById("statusText")
  const searchText = document.getElementById("searchText")
  const results = document.getElementById("results")
  const radiusInput = document.getElementById("radius")
  const radiusValue = document.getElementById("radiusValue")

  let controller = null

  radiusInput.oninput = () => {
    radiusValue.textContent = radiusInput.value + " km"
  }

  startBtn.onclick = () => {
    results.innerHTML = ""
    statusText.textContent = "Standort wird ermittelt..."
    searchText.textContent = "Tankstellen werden gesucht"
    controller = new AbortController()

    navigator.geolocation.getCurrentPosition(
      p => loadStations(p.coords.latitude, p.coords.longitude),
      () => {
        statusText.textContent = "Standort nicht verfügbar"
        searchText.textContent = ""
      }
    )
  }

  cancelBtn.onclick = () => {
    if (controller) {
      controller.abort()
      controller = null
      searchText.textContent = "Suche abgebrochen"
      statusText.textContent = ""
    }
  }

  function loadStations(lat, lon) {
    const radiusMeters = radiusInput.value * 1000
    statusText.textContent = "Tankstellen werden geladen..."

    const query = `
[out:json];
node["amenity"="fuel"](around:${radiusMeters}, ${lat}, ${lon});
out body;
`

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      signal: controller.signal
    })
    .then(r => r.json())
    .then(d => showStations(d.elements))
    .catch(e => {
      if (e.name !== "AbortError") {
        statusText.textContent = "Fehler beim Laden"
      }
    })
  }

  function showStations(stations) {
    searchText.textContent = ""

    if (!stations || stations.length === 0) {
      statusText.textContent = "Keine Tankstellen gefunden"
      return
    }

    statusText.textContent = stations.length + " Tankstellen gefunden"

    stations.forEach(s => {
      const lat = s.lat
      const lon = s.lon
      const name = s.tags?.name || "Unbekannte Tankstelle"

      const a = document.createElement("a")
      a.href = `https://www.google.com/maps?q=${lat},${lon}`
      a.target = "_blank"
      a.textContent = name

      const div = document.createElement("div")
      div.appendChild(a)

      results.appendChild(div)
    })
  }

})
