/* Local SVG atlas. Coordinates are geographic; each marker opens one event. */
(async function () {
  "use strict";
  const loading = document.getElementById("map-loading");
  try {
    if (!window.d3 || !window.topojson) throw new Error("Map libraries unavailable");
    const [placesResponse, mapResponse] = await Promise.all([fetch("pins.json"), fetch("vendor/land-110m.json")]);
    if (!placesResponse.ok || !mapResponse.ok) throw new Error("Map data unavailable");
    const [places, topology] = await Promise.all([placesResponse.json(), mapResponse.json()]);
    const svg = d3.select("#travel-map");
    // Crop the viewport, never city coordinates or the geographic projection.
    const width = 1100, height = 300;
    const viewLeft = 100, viewWidth = 920;
    const projection = d3.geoNaturalEarth1().fitExtent([[30, 12], [1070, 525]], {type:"Sphere"});
    const geoPath = d3.geoPath(projection);
    svg.append("defs").append("clipPath").attr("id","viewport-clip").append("rect").attr("x",viewLeft).attr("width",viewWidth).attr("height",height);
    const geography = svg.append("g").attr("clip-path","url(#viewport-clip)").append("g").attr("aria-hidden", "true");
    geography.append("path").datum(d3.geoGraticule10()).attr("class", "graticule").attr("d", geoPath);
    const land = topojson.feature(topology, topology.objects.land);
    geography.append("path").datum(land).attr("class", "land-shadow").attr("d", geoPath).attr("transform", "translate(1,2)");
    geography.append("path").datum(land).attr("class", "land").attr("d", geoPath);
    // The alternate washes are clipped by the actual land geometry.
    svg.append("defs").append("clipPath").attr("id", "land-clip").append("path").datum(land).attr("d", geoPath);
    const washes = geography.append("g").attr("clip-path", "url(#land-clip)");
    [[210,195,160,110],[555,275,75,100],[820,200,175,100],[900,400,80,60]].forEach(([cx,cy,rx,ry]) => {
      washes.append("ellipse").attr("cx",cx).attr("cy",cy).attr("rx",rx).attr("ry",ry).attr("fill","#bfcfb4").attr("opacity",.27);
    });
    const labels = [[-135,0,"Pacific Ocean"],[-34,1,"Atlantic Ocean"],[80,-24,"Indian Ocean"]];
    labels.forEach(([longitude, latitude, text]) => {
      const [x,y] = projection([longitude, latitude]);
      geography.append("text").attr("class","ocean-label").attr("x",x).attr("y",y).attr("text-anchor","middle").attr("transform",`rotate(-9 ${x} ${y})`).text(text);
    });
    const pins=svg.append('g').attr('clip-path','url(#viewport-clip)').append('g').attr('aria-label','Individual events');
    const popup=document.getElementById('event-popup');
    let year='all',selectedId=null,transform=d3.zoomIdentity,nodes=[];
    function layout(){
      const unit=viewWidth/svg.node().getBoundingClientRect().width;
      nodes=places.filter(e=>year==='all'||e.year===Number(year)).map(e=>{
        const [ax,ay]=transform.apply(projection([e.longitude,e.latitude]));
        return {...e,ax,ay,x:ax,y:ay};
      }).filter(e=>e.ax>=viewLeft&&e.ax<=viewLeft+viewWidth&&e.ay>=0&&e.ay<=height);
      // City anchors never move. Segments share the same center and each opens one event.
      const cities=Array.from(d3.group(nodes,e=>e.place_id),([id,events])=>({id,events,x:events[0].ax,y:events[0].ay}));
      const groups=pins.selectAll('g.city-pin').data(cities,c=>c.id).join('g')
        .attr('class','city-pin').attr('transform',c=>`translate(${c.x},${c.y})`)
        .on('pointerleave',(ev,c)=>{if(ev.pointerType==='mouse'&&c.events.some(e=>e.id===selectedId))close(false);});
      groups.each(function(city){
        const count=city.events.length,radius=(count>1?7:5)*unit;
        const arc=d3.arc().innerRadius(0).outerRadius(radius);
        const marks=d3.select(this).selectAll('path.map-pin').data(city.events,e=>e.id).join('path')
          .attr('class','map-pin pin-body').attr('role','button').attr('tabindex',0)
          .attr('d',(e,i)=>arc({startAngle:i*2*Math.PI/count,endAngle:(i+1)*2*Math.PI/count}))
          .attr('fill',(e,i)=>['#a86347','#c48b62','#885239'][i%3])
          .attr('stroke','#fffdf3').attr('stroke-width',1.2*unit)
          .attr('aria-label',e=>`${e.title}, ${e.city}, ${e.date_label}`)
          .attr('aria-pressed',e=>String(e.id===selectedId))
          .on('click',(ev,e)=>{ev.stopPropagation();select(e);})
          .on('keydown',(ev,e)=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();select(e);}});
        marks.selectAll('title').data(e=>[e]).join('title').text(e=>`${e.title} · ${e.city} · ${e.date_label}`);
      });
      positionPopup();
    }
    function select(e){
      selectedId=e.id;
      document.getElementById('event-title').textContent=e.title;
      document.getElementById('event-institution').textContent=e.institution;
      document.getElementById('event-location').textContent=`${e.city}, ${e.country}`;
      document.getElementById('event-date').textContent=e.date_label;
      popup.hidden=false;
      pins.selectAll('.map-pin').attr('aria-pressed',e=>String(e.id===selectedId));
      positionPopup();
    }
    function positionPopup(){
      const e=nodes.find(e=>e.id===selectedId);
      if(!e){popup.hidden=true;return;}
      const point=svg.node().createSVGPoint();point.x=e.x;point.y=e.y;
      const screen=point.matrixTransform(svg.node().getScreenCTM());
      const box=document.querySelector('.map-canvas').getBoundingClientRect();
      const x=screen.x-box.left,y=screen.y-box.top;
      const w=popup.offsetWidth,h=popup.offsetHeight;
      let left=x+15;if(left+w>box.width-8)left=x-w-15;
      popup.style.left=`${Math.max(8,Math.min(left,box.width-w-8))}px`;
      popup.style.top=`${Math.max(8,Math.min(y-h/2,box.height-h-8))}px`;
    }
    function close(restoreFocus=true){
      const id=selectedId;selectedId=null;popup.hidden=true;
      const selected=pins.selectAll('.map-pin').attr('aria-pressed','false').filter(e=>e.id===id);
      if(restoreFocus)selected.node()?.focus({preventScroll:true});
    }
    const zoom=d3.zoom().scaleExtent([1,80]).extent([[viewLeft,0],[viewLeft+viewWidth,height]])
      .filter(ev=>ev.type!=='wheel'&&!ev.target.closest('.city-pin')&&(!ev.button||ev.type==='touchstart'))
      .on('zoom',ev=>{transform=ev.transform;geography.attr('transform',transform);layout();});
    svg.call(zoom);
    document.getElementById('close-event').addEventListener('click',close);
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape')close();});
    document.getElementById('year-filter').addEventListener('change',ev=>{year=ev.target.value;close();svg.call(zoom.transform,d3.zoomIdentity);});
    document.getElementById('zoom-in').addEventListener('click',()=>{
      const selected=nodes.find(e=>e.id===selectedId);
      svg.call(zoom.scaleBy,1.7,selected?[selected.ax,selected.ay]:undefined);
    });
    document.getElementById('zoom-out').addEventListener('click',()=>svg.call(zoom.scaleBy,1/1.7));
    document.getElementById('reset-map').addEventListener('click',()=>{close();svg.call(zoom.transform,d3.zoomIdentity);});
    new ResizeObserver(layout).observe(svg.node());
    loading.hidden=true;
    document.getElementById('filters').hidden=false;
    document.querySelector('.map-controls').hidden=false;
    layout();
  } catch(error) {
    loading.textContent='The map could not load. Please try refreshing the page.';
    console.error('Along the Way map:',error);
  }
})();
