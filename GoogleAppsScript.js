/**
 * 학교 방문객 출입관리 시스템 - 구글 앱스 스크립트(GAS) 템플릿
 * 
 * [사용 방법]
 * 1. 구글 스프레드시트 생성
 * 2. 상단 메뉴 [확장 프로그램] > [Apps Script] 클릭
 * 3. 기존 코드를 모두 지우고 이 스크립트 내용 전체를 복사해서 붙여넣기
 * 4. 상단의 [저장 (디스크 아이콘)] 클릭
 * 5. 우측 상단의 [배포] > [새 배포] 클릭
 *    - 유형 선택: 웹앱 (톱니바퀴 아이콘 클릭 후 선택)
 *    - 설명: 학교 출입관리 연동
 *    - 다음 사용자 권한으로 실행: 웹앱을 액세스하는 사용자 (또는 본인 계정) -> **나(본인 구글 계정)**로 지정
 *    - 액세스 권한이 있는 사용자: **모든 사용자(Anyone)** 로 변경 (매우 중요!)
 *    - [배포] 버튼 클릭
 * 6. 구글 계정 액세스 승인 진행 (허용/승인 진행)
 * 7. 발급된 "웹앱 URL"을 복사하여 시스템의 통합 관리자 페이지에 등록합니다.
 */

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; // 첫 번째 탭 선택
    
    // 헤더 정의
    var headers = ['방문 일자', '입장 시간', '퇴장 시간', '이름', '연락처', '방문 목적', '방문 대상', '차량 번호', '상태'];
    
    // 1. 연동 테스트 & 헤더 초기화
    if (action === 'test') {
      var lastRow = sheet.getLastRow();
      
      // 첫 행에 헤더가 없거나 다르면 생성
      if (lastRow === 0 || sheet.getRange(1, 1).getValue() !== headers[0]) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1); // 첫 행 고정
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        spreadsheetUrl: ss.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. 방문 등록 (Check-in)
    if (action === 'checkin') {
      var lastRow = sheet.getLastRow();
      
      // 이전 기록의 날짜와 현재 저장하는 날짜가 다르면 구분선 행을 삽입합니다.
      if (lastRow > 1) {
        var lastDate = sheet.getRange(lastRow, 1).getDisplayValue().toString().trim();
        if (lastDate && lastDate !== requestData.date) {
          // A열에 날짜 구분선을 띄우고 배경색을 설정합니다.
          var dividerRow = [
            '--- ' + requestData.date + ' ---', // A: 구분 표시
            '', '', '', '', '', '', '', ''
          ];
          sheet.appendRow(dividerRow);
          
          // 새로 삽입된 구분 행의 배경색을 연한 회색(#e2e8f0)으로 처리하여 시인성을 확보합니다.
          var dividerRange = sheet.getRange(lastRow + 1, 1, 1, 9);
          dividerRange.setBackground('#e2e8f0');
          dividerRange.setFontColor('#475569');
          dividerRange.setFontWeight('bold');
        }
      }

      var rowData = [
        requestData.date,          // A: 방문 일자
        requestData.checkinTime,   // B: 입장 시간
        '',                        // C: 퇴장 시간 (비어있음)
        requestData.name,          // D: 이름
        requestData.contact,       // E: 연락처
        requestData.purpose,       // F: 방문 목적
        requestData.host,          // G: 방문 대상
        requestData.carNumber || '', // H: 차량 번호
        '입장'                     // I: 상태
      ];
      
      sheet.appendRow(rowData);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. 퇴장 처리 (Check-out)
    if (action === 'checkout') {
      var name = requestData.name;
      var contact = requestData.contact;
      var checkoutTime = requestData.checkoutTime;
      
      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: '시트에 방문 기록이 존재하지 않습니다.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // getDisplayValues()를 사용하여 텍스트 형식 그대로 읽어오기 (1899년 포맷 오작동 방지)
      var data = sheet.getRange(1, 1, lastRow, 9).getDisplayValues();
      var foundRowIndex = -1;
      
      // 최신 행부터 역순 탐색
      for (var i = lastRow - 1; i >= 1; i--) {
        var rowName = data[i][3];
        var rowContact = data[i][4];
        var rowCheckout = data[i][2];
        
        if (rowName === name && rowContact === contact && (!rowCheckout || rowCheckout.toString().trim() === '')) {
          foundRowIndex = i + 1; // 1-indexed
          break;
        }
      }
      
      if (foundRowIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: '입장 기록이 없거나 이미 퇴장 처리된 방문자입니다.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // 퇴장 시간 기록 및 상태 갱신
      sheet.getRange(foundRowIndex, 3).setValue(checkoutTime); // C열: 퇴장 시간
      sheet.getRange(foundRowIndex, 9).setValue('퇴장');       // I열: 상태
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        success: true,
        checkoutTime: checkoutTime
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 4. 오늘 방문객 모니터링 데이터 가져오기
    if (action === 'getTodayVisitors') {
      // 한국 표준시 기준으로 오늘 날짜(YYYY-MM-DD) 구하기
      var todayDate = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
      
      var lastRow = sheet.getLastRow();
      var todayVisits = 0;
      var currentlyIn = 0;
      var visitors = [];
      
      if (lastRow > 1) {
        // getDisplayValues()를 사용하여 셀 텍스트를 그대로 읽어옵니다. (1899년 변환 이슈 해결!)
        var data = sheet.getRange(1, 1, lastRow, 9).getDisplayValues();
        
        for (var i = 1; i < lastRow; i++) {
          var rowDate = data[i][0] ? data[i][0].toString().trim() : '';
          
          // 날짜 비교
          if (rowDate === todayDate) {
            todayVisits++;
            
            var checkoutTime = data[i][2] ? data[i][2].toString().trim() : '';
            var status = data[i][8] || '입장';
            
            if (status === '입장' && (!checkoutTime || checkoutTime === '')) {
              currentlyIn++;
            }
            
            visitors.push({
              rowIndex: i + 1,
              date: rowDate,
              checkinTime: data[i][1] ? data[i][1].toString() : '',
              checkoutTime: checkoutTime,
              name: data[i][3] ? data[i][3].toString() : '',
              contact: data[i][4] ? data[i][4].toString() : '',
              purpose: data[i][5] ? data[i][5].toString() : '',
              host: data[i][6] ? data[i][6].toString() : '',
              carNumber: data[i][7] ? data[i][7].toString() : '',
              status: status
            });
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        todayDate: todayDate,
        summary: {
          todayVisits: todayVisits,
          currentlyIn: currentlyIn
        },
        visitors: visitors
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 5. 30일 보존 기한 경과 데이터 파기/익명화
    if (action === 'anonymize') {
      var retentionDays = requestData.retentionDays || 30;
      var lastRow = sheet.getLastRow();
      var anonymizedCount = 0;
      
      if (lastRow > 1) {
        // getDisplayValues() 적용
        var data = sheet.getRange(1, 1, lastRow, 9).getDisplayValues();
        var now = new Date();
        
        for (var i = 1; i < lastRow; i++) {
          var dateStr = data[i][0];
          if (!dateStr) continue;
          
          // 이미 익명화된 데이터 스킵
          if (data[i][3] === '[익명]' && data[i][4] === '[삭제]' && data[i][7] === '[삭제]') {
            continue;
          }
          
          var recordDate = new Date(dateStr);
          var diffTime = Math.abs(now.getTime() - recordDate.getTime());
          var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > retentionDays) {
            var rowIndex = i + 1;
            sheet.getRange(rowIndex, 4).setValue('[익명]'); // 이름 파기
            sheet.getRange(rowIndex, 5).setValue('[삭제]'); // 연락처 파기
            sheet.getRange(rowIndex, 8).setValue('[삭제]'); // 차량번호 파기
            anonymizedCount++;
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        anonymizedCount: anonymizedCount
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '지원하지 않는 액션(action)입니다.'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
