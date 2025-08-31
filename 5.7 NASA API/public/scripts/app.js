console.log("app.js is loaded and running");

const sel = (q, el = document) => el.querySelector(q);
const selAll = (q, el = document) => Array.from(el.querySelectorAll(q));

document.addEventListener("DOMContentLoaded", () => {
  initDateForm();
  initMonthForm();
});

function initDateForm() {
  const form = sel("#dateForm");
  if (!form) return;

  //Date Selected
  const sectionThree = sel("#three");
  const sdTitle = sel("#sdTitle");
  const sdDate = sel("#sdDate");
  const sdExplanation = sel("#sdExplanation");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); //progressive enhancement: skip reload
    const formData = new FormData(form);
    const date = formData.get("date");
    if (!date) return;

    try {
      const res = await fetch(`/date/?date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error("APOD failed");
      const data = await res.json();

      sdTitle.textContent = data.title || "";
      sdDate.textContent = data.date || "";
      sdExplanation.textContent = data.explanation || "";

      //show section 3
      sectionThree.style.display = "block";

      if (data.image) {
        //set background image for the whole section
        sectionThree.style.backgroundImage = `url('${data.image}')`;
        sectionThree.style.backgroundRepeat = "no-repeat";
        sectionThree.style.backgroundSize = "cover";
        sectionThree.style.backgroundPosition = "center";
      } else if (data.video) {
        sectionThree.style.backgroundImage = "";
        sectionThree.innerHTML = `
        <video controls autoplay loop muted>
        <source src="${data.video}" type="video/mp4">
        Your browser does not support the video tag.
        </video>`;
      } else {
        sectionThree.style.backgroundImage = "";
      }
    } catch (err) {
      console.error(err);
      sdTitle.textContent = "No data";
      sdDate.textContent = "";
      sdExplanation.textContent = "";
      sectionThree.style.backgroundImage = "";
    }
  });
}

function initMonthForm() {
  const form = sel("#pastDays");
  const buttons = selAll('button[name="month"]', form);
  if (!form) return;
  const gridImages = sel("#gridImages");

  async function loadMonth(month) {
    gridImages.innerHTML = `
    <div class="loading">
      <div class="spinner-grow text-light" role="status">
       <span class="visually-hidden">Loading...</span>
       </div>
      <p>Loading images...</p>
    </div>
  `;

    try {
      const res = await fetch(`/month?month=${encodeURIComponent(month)}`);
      if (!res.ok) throw new Error("APOD failed");
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        gridImages.innerHTML = `<p>No images for this month.</p>`;
        return;
      }

      // Render images (use hdurl or fallback to url)
      const html = data
        .map((p) => {
          const src = p.hdurl || p.url;
          const title = escapeHtml(p.title || "");
          const mediaType = p.media_type;
          //const date = escapeHtml(p.date || "");

          if (mediaType === 'image'){
          return `
            <figure class="title-description gap-1 grey">
              <img src="${src}" alt="${title}" loading="lazy" />
              <cite title="Source Title grey"> ${title}</cite>
            </figure>
          `;
          } else if(mediaType === 'video'){     
          return  `
          <figure class="title-description gap-1 grey">
            <video controls autoplay loop muted>
                <source src="${data.video}" type="video/mp4">
            </video>
          <cite title="Source Title grey"> ${title}</cite>
          </figure>
          `;
        
          }
        })
        .join("");
      gridImages.innerHTML = html;
    } catch (err) {
      console.error(err);
      gridImages.innerHTML = `<p>Error loading month.</p>`;
    }
  }

  //pre-load first month
  const firstBtn = sel("#buttonOne");
  if (firstBtn) {
    loadMonth(firstBtn.value);
    setActiveButton(firstBtn);
  }

  //other month for clicking on other buttons
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let month = e.submitter?.value;
    const clickedBtn = e.submitter;
    if (!month) {
      month = firstBtn.value;
    }
    loadMonth(month);
    setActiveButton(clickedBtn);
  });

  //active buttons
  function setActiveButton(activeBtn) {
    buttons.forEach((btn) => btn.classList.remove("active"));
    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }
}

// Simple escaper for captions
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
