import {createContext} from 'react';
 export const defaults = {
  canvas: {
    height: 4500,
    width: 4000,
    padding: 0,
    viewBox: {
      o: (-2000 / 30),
      tw: 500,
      th: 5000,
      f: 4500
    }
  },
  data: {
    db: {
      name: "factchecker_presidential_debate",
      labelCol: "response",
      labelerCol: "username",
      labeleeIdCol: "id",
      labeleeContentCol: "text",
      joinQuery: "select distinct S.id as id, S.text as text, SU.username as username, A.time as time, A.response as response from Sentence S join Sentence_User SU on S.id = SU.sentence_id join Activity A on SU.sentence_id = A.sentence_id and SU.username = A.username and A.time=SU.time where S.id in (select raw.id from (select S.id as id, count(S.id) as cnt from Sentence S join Sentence_User SU on S.id = SU.sentence_id join Activity A on SU.sentence_id = A.sentence_id and SU.username = A.username and A.time=SU.time group by S.id limit 5000) as raw where raw.cnt > 10);",
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
  response: {},
  sortingConf: {
        lhs: "alphabetical labeler",
        rhs: "numerical id"
  }
}
export const GraphContext = createContext()
