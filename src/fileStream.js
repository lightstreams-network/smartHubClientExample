
export const stream = async (gwDomain, meta, token, stream) => {
  let url = `${gwDomain}/storage/stream?meta=${meta}`;
  if (token) {
    url = `${gwDomain}/storage/stream?meta=${meta}&token=${token}`;
  }
  return fetchFile(url, {
    stream,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const fetchFile = async (url, options = {}) => {
  const defaultOptions = {
    json: true,
    throwHttpErrors: false,
    followRedirect: false,
  };
  let res = await fetch(url, {
    ...defaultOptions,
    ...options,
    method: 'GET',
  });
  
  if(options['stream']) {
    return res;
  }

  if (res.status === 200) {
    return parseResponse(res)
  }

  if (res.headers.get('content-type').indexOf('json') !== -1) {
    return parseResponse(res)
  }

  return {
    status: res.status,
    message: res.statusText
  }
};

const parseResponse = (gwResponse) => {
  if (gwResponse.status !== 200) {
    return gwResponse.json().then(parsedResponse => {
      if (typeof parsedResponse === 'object' && typeof parsedResponse.error === 'object') {
        throw parsedResponse.error;
      }
      throw parsedResponse;
    })
  } else {
    return gwResponse.json().then(parsedResponse => {
      const { error, ...response } = parsedResponse;
      if (error) {
        throw error;
      }

      return response;
    })
  }
};