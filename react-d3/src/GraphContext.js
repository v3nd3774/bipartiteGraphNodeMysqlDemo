import {createContext} from 'react';
 export const defaults = {
  canvas: {
    height: 2000,
    width: 2000,
    padding: 0,
    viewBox: {
      o: (-2000 / 30),
      tw: (-2000 / 30),
      th: 2000/2,
      f: 2000*0.6
    }
  },
  data: {
    db: {
      name: "factchecker_presidential_debate",
      labelCol: "response",
      labelerCol: "username",
      labeleeIdCol: "id",
      labeleeContentCol: "text",
      joinQuery: "select distinct S.id as id, S.text as text, SU.username as username, A.time as time, A.response as response from Sentence S join Sentence_User SU on S.id = SU.sentence_id join Activity A on SU.sentence_id = A.sentence_id and SU.username = A.username and A.time=SU.time limit 1000;",
      timeCol: "time",
      timeOutFormat: "%Y-%m-%d %H:%M:%S"
    },
    api: {
      request: "GET",
      protocol: "http",
      host: "localhost",
      port: "5001",
      endpoint: "environ",
      getorPost: true
    }
  },
  response: {}
}
export const GraphContext = createContext()
