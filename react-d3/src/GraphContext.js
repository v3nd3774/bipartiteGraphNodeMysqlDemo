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
      joinQuery: "select RANK.RANK_E as user_quality_score, TMPTBL.* from (select distinct S.id as id, S.text as text, SU.username as username, A.time as time, A.response as response from Sentence S          join Sentence_User SU on S.id = SU.sentence_id          join Activity A on SU.sentence_id = A.sentence_id and SU.username = A.username and A.time = SU.time where S.id in (select raw.id                from (select S.id as id, count(S.id) as cnt                      from Sentence S                               join Sentence_User SU on S.id = SU.sentence_id                               join Activity A                                    on SU.sentence_id = A.sentence_id and SU.username = A.username and A.time = SU.time                      group by S.id                      limit 5000) as raw                where raw.cnt > 10) limit 1000) as TMPTBL          join (              select USERNAME,PROFESSION,RANK_E,RANK_W,ANSWERED as '#', A.SKIPPED/A.ANSWERED as SKIP, A.LEN,round(A.LEN/18.4217*A.ANSWERED*sign(0.3 - A.RANK_W)*pow((0.3 - A.RANK_W),2),2) AS RANK_L,     if(ANSWERED >= 50, round(if( RANK_W <= 0, 3-7*RANK_W/0.2, if(RANK_W<=0.3, pow((0.3-RANK_W)/0.3, 2.5)*3, 0) ),2), 0) as Quality,     if(ANSWERED >= 50, 1.5*round(if( RANK_W <= 0, 3-7*RANK_W/0.2, if(RANK_W<=0.3, pow((0.3-RANK_W)/0.3, 2.5)*3, 0) )*pow((A.LEN/18.4217), 1.5)*pow(0.6, A.SKIPPED/A.ANSWERED),2), 0) as PAYRATE,     if(ANSWERED >= 50, 1.5*round(if( RANK_W <= 0, 3-7*RANK_W/0.2, if(RANK_W<=0.3, pow((0.3-RANK_W)/0.3, 2.5)*3, 0) )*pow((A.LEN/18.4217), 1.5)*ANSWERED/100*pow(0.6, A.SKIPPED/A.ANSWERED),2), 0) as PAYMENT,     NFS,NO,YES,NFS_NFS,NFS_NO,NFS_YES,NO_NFS,NO_NO,NO_YES,YES_NFS,YES_NO,YES_YES from (select     Sentence_User.username as USERNAME, profession as PROFESSION,      round((pow(sum(if(screening = -1 and response = -1, 1, 0))/sum(if(screening = -1 and response != -2, 1, 0))-sum(if(screening = 0 and response = -1, 1, 0))/sum(if(screening = 0 and response != -2, 1, 0)),2)+     pow(sum(if(screening = -1 and response = 0, 1, 0))/sum(if(screening = -1 and response != -2, 1, 0))-sum(if(screening = 0 and response = 0, 1, 0))/sum(if(screening = 0 and response != -2, 1, 0)),2)+     pow(sum(if(screening = -1 and response = 1, 1, 0))/sum(if(screening = -1 and response != -2, 1, 0))-sum(if(screening = 0 and response = 1, 1, 0))/sum(if(screening = 0 and response != -2, 1, 0)),2)+     pow(sum(if(screening = -1 and response = -1, 1, 0))/sum(if(screening = -1 and response != -2, 1, 0))-sum(if(screening = 1 and response = -1, 1, 0))/sum(if(screening = 1 and response != -2, 1, 0)),2)+     pow(sum(if(screening = -1 and response = 0, 1, 0))/sum(if(screening = -1 and response != -2, 1, 0))-sum(if(screening = 1 and response = 0, 1, 0))/sum(if(screening = 1 and response != -2, 1, 0)),2)+     pow(sum(if(screening = -1 and response = 1, 1, 0))/sum(if(screening = -1 and response != -2, 1, 0))-sum(if(screening = 1 and response = 1, 1, 0))/sum(if(screening = 1 and response != -2, 1, 0)),2)+     pow(sum(if(screening = 0 and response = -1, 1, 0))/sum(if(screening = 0 and response != -2, 1, 0))-sum(if(screening = 1 and response = -1, 1, 0))/sum(if(screening = 1 and response != -2, 1, 0)),2)+     pow(sum(if(screening = 0 and response = 0, 1, 0))/sum(if(screening = 0 and response != -2, 1, 0))-sum(if(screening = 1 and response = 0, 1, 0))/sum(if(screening = 1 and response != -2, 1, 0)),2)+     pow(sum(if(screening = 0 and response = 1, 1, 0))/sum(if(screening = 0 and response != -2, 1, 0))-sum(if(screening = 1 and response = 1, 1, 0))/sum(if(screening = 1 and response != -2, 1, 0)),2))/(3*2), 3) as RANK_E,      round(-0.2*(sum(if(screening = -1 and response = -1, 1, 0))+sum(if(screening = 0 and response = 0, 1, 0))+sum(if(screening = 1 and response = 1, 1, 0)))/(sum(screening != -3 and response != -2))     +0.7*(sum(if(screening = 0 and response = 1, 1, 0))+sum(if(screening = 1 and response = 0, 1, 0)))/(sum(screening != -3 and response != -2))     +0.7*(sum(if(screening = -1 and response = 0, 1, 0))+sum(if(screening = 0 and response = -1, 1, 0)))/(sum(screening != -3 and response != -2))     +2.5*(sum(if(screening = -1 and response = 1, 1, 0))+sum(if(screening = 1 and response = -1, 1, 0)))/(sum(screening != -3 and response != -2)), 3) as RANK_W,      sum(if(Sentence_User.response != -2, 1, 0)) as ANSWERED,     sum(if(Sentence_User.response = -2, 1, 0)) as SKIPPED,     avg(if(Sentence_User.response != -2, length, null)) as LEN,      sum(if(response = -1,1,0)) as NFS,     sum(if(response = 0,1,0)) as NO,     sum(if(response = 1,1,0)) as YES,      sum(if(screening = -1 and response = -1, 1, 0)) as NFS_NFS,     sum(if(screening = -1 and response = 0, 1, 0)) as NFS_NO,     sum(if(screening = -1 and response = 1, 1, 0)) as NFS_YES,     sum(if(screening = 0 and response = -1, 1, 0)) as NO_NFS,     sum(if(screening = 0 and response = 0, 1, 0)) as NO_NO,     sum(if(screening = 0 and response = 1, 1, 0)) as NO_YES,     sum(if(screening = 1 and response = -1, 1, 0)) as YES_NFS,     sum(if(screening = 1 and response = 0, 1, 0)) as YES_NO,     sum(if(screening = 1 and response = 1, 1, 0)) as YES_YES from     Sentence_User,     Sentence,     User where     id = sentence_id and     Sentence_User.username = User.username and     Sentence_User.username != 'factchecker' and     Sentence_User.time >= '2019-08-12 12:00:00' and     sentence_id not in (select sentence_id from Training) group by Sentence_User.username) A order by PAYMENT desc ) as RANK on TMPTBL.username = RANK.USERNAME;",
      userQualityScoreCol: "user_quality_score",
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
  },
  filterConf: {
        omitSkip: false,
        timeRanges: [
            ["00:00:00", "23:59:59"]
        ],
        datetimeRanges: [
            [new Date("01/01/1970"), new Date()]
        ]
  }
}
export const GraphContext = createContext()
