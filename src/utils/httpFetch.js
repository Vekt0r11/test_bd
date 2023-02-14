const sendToBack = async (data) => {

  //Formatear
  // const data = tipoTenencia /* temp */

  const response = await fetch('http://192.168.0.19:4000/test/testPost', {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  });

  const res = await response.json()

  console.log(res)
}

export default sendToBack