/**
 * Dữ liệu 13 trang thực tế của bài báo y khoa VNUHCM ID630:
 * "Tổng quan về loét dạ dày tá tràng ở người cao tuổi và cập nhật trong điều trị"
 * Trích xuất 100% từ mã nguồn LaTeX, XML, DOCX và PDF gốc.
 * Dòng chảy phân trang liên tục (Continuous Dynamic Flow), không hardcode ngắt cột hay ngắt trang.
 */

export interface ID630PageBlock {
  type: 'heading' | 'subheading' | 'paragraph';
  content: string;
}

export interface ID630DemoPage {
  pageNumber: number;
  label: string;
  hasFigure?: boolean;
  figureData?: {
    id: string;
    number: number;
    title: string;
    source: string;
    imageSrc: string;
  };
  hasTable?: boolean;
  tableData?: {
    id: string;
    number: number;
    title: string;
    source: string;
    headers: string[];
    rows: Array<{
      isSubheader?: boolean;
      subheaderText?: string;
      cols?: string[];
    }>;
  };
  blocks: ID630PageBlock[];
  column1?: ID630PageBlock[];
  column2?: ID630PageBlock[];
}

export const ID630_DEMO_PAGES: ID630DemoPage[] = [
  {
    "pageNumber": 1,
    "label": "Trang 1: Bìa, Tóm tắt & Dẫn nhập",
    "blocks": [
      {
        "type": "heading",
        "content": "GIỚI THIỆU VỀ BỆNH LOÉT DẠ DÀY TÁ TRÀNG:"
      },
      {
        "type": "paragraph",
        "content": "Loét dạ dày tá tràng là tình trạng tổn thương niêm mạc dạ dày hoặc tá tràng. Theo vị trí giải phẫu, loét dạ dày được chia thành loét dạ dày, tức là loét dạ dày ở phình vị, thân hoặc hang vị, loét tiền môn vị và môn vị nghĩa là nằm cách vòng môn vị trong vòng 3 cm tương ứng và loét tá tràng nghĩa là nằm trong hành tá tràng hay ở phần thứ hai của tá tràng (Hình 1)¹."
      },
      {
        "type": "paragraph",
        "content": "Ở người cao tuổi, loét dạ dày tá tràng không chỉ đơn thuần là sự xuất hiện tổn thương niêm mạc dạ dày mà là một thực thể lâm sàng riêng biệt. Nó gắn liền với sự suy giảm chức năng sinh lý dạ dày, tình trạng suy nhược, đa bệnh lý và việc sử dụng đồng thời nhiều loại thuốc, đòi hỏi chiến lược tiếp cận chuyên biệt²."
      },
      {
        "type": "paragraph",
        "content": "Trong nội dung của chúng tôi, người bệnh được xem là người cao tuổi được xác định thống nhất từ 65 tuổi trở lên² như trong các hướng dẫn thực hành lâm sàng và các nghiên cứu cập nhật về đối tượng người cao tuổi³."
      },
      {
        "type": "heading",
        "content": "DỊCH TỄ HỌC:"
      },
      {
        "type": "paragraph",
        "content": "Dịch tễ học của loét dạ dày tá tràng ở bệnh nhân lớn tuổi cho thấy một bức tranh phức tạp và đa dạng. Tỷ lệ mắc loét dạ dày tá tràng trên toàn cầu dao động từ 0,1% đến 4,7%, với tỷ lệ mắc mới hàng năm khoảng 0,19–0,3%. Loét tá tràng thường gặp hơn ở các nước phương Tây, trong khi loét dạ dày phổ biến hơn tại châu Á."
      },
      {
        "type": "paragraph",
        "content": "Mặc dù tỷ lệ hiện mắc và mắc mới loét dạ dày – tá tràng nhìn chung có xu hướng giảm, tần suất mắc bệnh, biến chứng và tỷ lệ tử vong lại tăng rõ rệt theo tuổi, đặc biệt ở người cao tuổi, khiến bệnh vẫn là một vấn đề y tế quan trọng trong bối cảnh già hóa dân số toàn cầu¹¹. Phân tích dữ liệu Global Burden of Disease cho thấy số ca loét tiêu hóa ở nhóm người ≥ 70 tuổi tăng từ khoảng 1,06 triệu trường hợp năm 1990 lên 1,61 triệu trường hợp năm 2019, dù tỷ lệ hiện mắc chuẩn hóa theo tuổi có xu hướng giảm, phản ánh hiệu quả của các biện pháp dự phòng và điều trị như kiểm soát Helicobacter pylori và sử dụng thuốc ức chế tiết acid. Gánh nặng bệnh có sự khác biệt theo khu vực địa"
      }
    ],
    "column1": [],
    "column2": []
  },
  {
    "pageNumber": 2,
    "label": "Trang 2: Hình 1 (Vị trí giải phẫu) & Sinh lý bệnh",
    "hasFigure": true,
    "figureData": {
      "id": "fig_1",
      "number": 1,
      "title": "Vị trí giải phẫu của loét dạ dày tá tràng.",
      "source": "Pilotto A FM. Upper Gastrointestinal Disorders. Hazzard's Geriatric Medicine and Gerontology, 8th, 2022. McGraw Hill¹",
      "imageSrc": "/demo-assets/id630/fig1.png"
    },
    "blocks": [
      {
        "type": "paragraph",
        "content": "lý, cao hơn tại các quốc gia thu nhập trung bình–thấp⁴ và một số vùng châu Á, châu Phi⁴. Ở người cao tuổi, loét dạ dày thường mang tính đa yếu tố, liên quan đến sử dụng NSAIDs/aspirin, thuốc kháng đông, đa bệnh lý mạn tính và suy giảm cơ chế bảo vệ niêm mạc, dẫn đến nguy cơ biến chứng và tử vong cao hơn so với người trẻ⁴,⁵."
      },
      {
        "type": "heading",
        "content": "SINH LÝ BỆNH VÀ PHÂN LOẠI:"
      },
      {
        "type": "paragraph",
        "content": "Quá trình lão hóa gây ra những thay đổi cấu trúc và chức năng sâu sắc, ở dạ dày, lão hoá làm suy yếu hàng rào bảo vệ niêm mạc chủ yếu do các yếu tố: (1) Lão hóa miễn dịch là sự suy giảm phản ứng miễn dịch tại chỗ khiến niêm mạc dạ dày dễ bị vi khuẩn H. pylori tấn công và gây viêm mãn tính kéo dài, (2) Rối loạn vi tuần hoàn là sự giảm tưới máu niêm mạc và rối loạn chức năng các mạch máu nhỏ làm chậm quá trình chữa lành vết thương, đặc biệt dưới tác động của căng thẳng sinh lý và (3) Tình trạng giảm toan và loạn khuẩn là sự teo niêm mạc dẫn đến giảm tiết acid, làm thay đổi hệ vi sinh vật dạ dày, tạo điều kiện cho các vi khuẩn có hại phát triển và làm giảm hấp thu các dưỡng chất thiết yếu như Vitamin B12, sắt và canxi²."
      },
      {
        "type": "paragraph",
        "content": "Từ đó giải thích cho hai yếu tố chính có thể giải thích sự gia tăng loét dạ dày tá tràng được quan sát thấy ở bệnh nhân cao tuổi là tỷ lệ nhiễm H. pylori cao và việc sử dụng thường xuyên các thuốc gây tổn thương niêm mạc như NSAID và aspirin."
      },
      {
        "type": "paragraph",
        "content": "Tuy nhiên, ở những người cao tuổi, khoảng 20% tổng số ca loét dạ dày tá tràng không liên quan đến một trong hai yếu tố nguy cơ này (Hình 2)⁶. Sinh lý bệnh của bệnh loét dạ dày tá tràng không do NSAID, không do H. pylori được gọi là “vô căn” thì vẫn chưa chắc chắn, nhưng dường như có sự mất cân bằng nghiêm trọng giữa các yếu tố bảo vệ và ăn mòn ở niêm mạc dạ dày hoặc tá tràng."
      },
      {
        "type": "paragraph",
        "content": "Tuổi cao có liên quan đến việc giảm hàng rào niêm mạc dạ dày, nghĩa là khả năng chống lại các tổn thương bên ngoài do tiết chất nhầy dạ dày, bài tiết bicarbonate, prostaglandin niêm mạc, tăng sinh niêm mạc dạ dày và/hoặc lưu lượng máu niêm mạc. Hơn nữa, ở những bệnh nhân cao tuổi mắc bệnh loét dạ dày tá tràng, đã quan sát thấy nồng độ axit dạ dày và pepsin tiết ra ở mức bình thường hoặc cao. Mặc dù tuổi cao có liên quan độc lập với viêm teo dạ dày mãn tính và tình trạng chức năng của tình trạng giảm/thiếu axit dịch vị, những thay đổi teo của niêm mạc dạ dày dường như có liên quan đến nhiễm H. pylori hơn là do lão hóa. Căng thẳng về cảm xúc, hút thuốc lá và/hoặc sử dụng rượu là những yếu tố nguy cơ tiềm ẩn có thể góp phần vào sự phát triển loét dạ dày tá tràng ở những đối tượng dễ mắc¹."
      }
    ],
    "column1": [],
    "column2": []
  },
  {
    "pageNumber": 3,
    "label": "Trang 3: Hình 2 (Tỷ lệ loét H. pylori / NSAID)",
    "blocks": [
      {
        "type": "heading",
        "content": "BỆNH LOÉT DẠ DÀY LIÊN QUAN ĐẾN H. PYLORI:"
      },
      {
        "type": "paragraph",
        "content": "Nhiễm Helicobacter pylori vẫn phổ biến ở người cao tuổi, mặc dù tỷ lệ nhiễm đã giảm ở các thế hệ trẻ nhờ cải thiện điều kiện vệ sinh và chăm sóc y tế². Khoảng 70% bệnh nhân loét dạ dày tá tràng cao tuổi có H. pylori dương tính (Hình 2). Điều trị nhiễm H. pylori giúp chữa lành vết loét ở hơn 95% bệnh nhân cao tuổi và cải thiện triệu chứng ở hơn 85%."
      },
      {
        "type": "paragraph",
        "content": "Hơn nữa, việc triệt trừ H. pylori giúp cải thiện kết quả lâm sàng, giảm các triệu chứng và tái phát loét. Các chương trình y tế nhằm triệt trừ H. pylori trên diện rộng ở những bệnh nhân có triệu chứng đã làm giảm tỷ lệ mắc bệnh loét dạ dày tá tràng, đặc biệt là loét tá tràng, cả ở Châu Âu và Viễn Đông."
      },
      {
        "type": "paragraph",
        "content": "Tuy nhiên, tỷ lệ bệnh nhân cao tuổi mắc loét dạ dày tá tràng được điều trị nhiễm H. pylori vẫn còn khá thấp. Trong một nghiên cứu ở Hoa Kỳ, chỉ 40% đến 56% bệnh nhân > 65 tuổi nhập viện vì loét dạ dày tá tràng được xét nghiệm nhiễm H. pylori và trong số những bệnh nhân dương tính với H. pylori, chỉ có 50% đến 73% được điều trị bằng liệu pháp triệt trừ H. pylori dựa trên kháng sinh cụ thể⁶."
      },
      {
        "type": "heading",
        "content": "BỆNH LOÉT DẠ DÀY TÁ TRÀNG LIÊN QUAN ĐẾN NSAID/ASPIRIN:"
      },
      {
        "type": "paragraph",
        "content": "Ở bệnh nhân cao tuổi, khoảng 25% loét tá tràng và 40% loét dạ dày có liên quan đến việc sử dụng NSAID và/hoặc aspirin (Hình 2). Nguy cơ loét dạ dày tá tràng liên quan đến NSAID và các biến chứng nghiêm trọng của chúng có xu hướng tăng tuyến tính theo độ tuổi và trở nên đặc biệt cao khi có tình trạng khuyết tật, bệnh đi kèm và dùng nhiều loại thuốc."
      },
      {
        "type": "paragraph",
        "content": "Một nghiên cứu bệnh chứng được thực hiện ở hơn 3000 bệnh nhân cao tuổi được nội soi đã ghi nhận rằng những đối tượng đang điều trị NSAID và/hoặc aspirin có tỷ lệ loét dạ dày và tá tràng cao hơn so với nhóm chứng không sử dụng. Hơn nữa, nguy cơ loét dạ dày tá tràng cao hơn đáng kể ở người dùng ngắn hạn so với người dùng NSAID hoặc aspirin dài hạn (Hình 3)."
      },
      {
        "type": "paragraph",
        "content": "Tác dụng gây tổn thương dạ dày tá tràng của NSAID và aspirin chủ yếu là do ức chế COX-1 (COX-1 có vai trò bảo vệ niêm mạc), nhưng cũng do ức chế Thromboxane A2 nên làm giảm chức năng tiểu cầu, dẫn đến nguy cơ chảy máu cao hơn. Tuy nhiên, không thể loại trừ tác dụng trực tiếp lên bề mặt niêm mạc dạ dày tá tràng, đặc biệt đối với NSAID có tỷ lệ pK axit/bazơ cao⁶."
      },
      {
        "type": "paragraph",
        "content": "Các NSAID khác nhau có liên quan đến các tác dụng phụ trên đường tiêu hóa khác nhau, tuy nhiên không NSAID nào cho thấy độ an toàn tuyệt đối. Các đặc tính dược lực học và dược động học liên quan đến thuốc có thể giải thích sự biến đổi của từng loại thuốc về tác dụng phụ trên đường tiêu hóa trên. Khuynh hướng di truyền do tính đa hình của cytochrome P4502C9 làm giảm chuyển hóa của một số NSAID với thời gian dùng thuốc kéo dài, làm tăng nguy cơ tổn thương niêm mạc đường tiêu hóa, đã được báo cáo là yếu tố tiềm ẩn ảnh hưởng đến tác dụng gây loét của các NSAID khác nhau⁷."
      }
    ],
    "column1": [],
    "column2": [],
    "hasFigure": true,
    "figureData": {
      "id": "fig_2",
      "number": 2,
      "title": "Tỷ lệ loét dạ dày và tá tràng ở bệnh nhân cao tuổi phân chia theo sự hiện diện của nhiễm H pylori và/hoặc sử dụng NSAID.",
      "source": "Pilotto A. Helicobacter pylori-associated peptic ulcer disease in older patients: current management strategies. Drugs & aging. 2001;18(7):487-94⁶",
      "imageSrc": "/demo-assets/id630/fig2.png"
    }
  },
  {
    "pageNumber": 4,
    "label": "Trang 4: Hình 3 (Tỷ lệ loét theo thời gian dùng NSAID)",
    "blocks": [
      {
        "type": "heading",
        "content": "CHẨN ĐOÁN:"
      },
      {
        "type": "paragraph",
        "content": "Ở người cao tuổi, loét dạ dày tá tràng thường khó chẩn đoán vì các triệu chứng có thể không điển hình. Các bệnh và các thuốc điều trị đồng thời của bệnh nhân có thể gây ra các triệu chứng che lấp các triệu chứng của vết loét. Ở những bệnh nhân > 60 tuổi, chỉ 1/3 bị đau thượng vị điển hình và 2/3 bị đau bụng mơ hồ là triệu chứng chính. Hơn nữa, cường độ đau có thể ít nghiêm trọng hơn ở những người cao tuổi và do đó bác sĩ có thể bỏ sót hoặc có thể không được bệnh nhân coi trọng."
      },
      {
        "type": "paragraph",
        "content": "Thông thường, triệu chứng bao gồm buồn nôn, nôn, sụt cân và/hoặc chán ăn là triệu chứng đầu tiên hoặc thậm chí là duy nhất của loét dạ dày tá tràng ở người cao tuổi. Tuy nhiên, triệu chứng đầu tiên có thể là một biến chứng nghiêm trọng, đặc biệt là chảy máu hoặc hẹp môn vị."
      },
      {
        "type": "paragraph",
        "content": "Do biểu hiện lâm sàng âm thầm của bệnh ở bệnh nhân cao tuổi nên hậu quả của loét dạ dày tá tràng nghiêm trọng hơn so với bệnh nhân trẻ tuổi¹. Nội soi tiêu hóa trên và sinh thiết, đây là tiêu chuẩn vàng trong chẩn đoán loét dạ dày tá tràng."
      },
      {
        "type": "paragraph",
        "content": "Cần thực hiện sinh thiết mapping theo hệ thống Sydney cải tiến (ít nhất 5 vị trí: 2 hang vị, 2 thân vị, 1 góc bờ cong nhỏ) để đánh giá teo niêm mạc và chuyển sản ruột theo hệ thống OLGA (Operative Link on Gastritis Assessment) và OLGIM (Operative Link on Gastric Intestinal Metaplasia) dựa trên kết quả mô bệnh học từ các mẫu sinh thiết dạ dày theo hệ thống Sydney cải tiến."
      },
      {
        "type": "paragraph",
        "content": "Mức độ teo niêm mạc hoặc chuyển sản ruột được chấm điểm từ 0 đến 3 riêng cho hang vị và thân vị, sau đó phân loại thành các giai đoạn từ 0 đến IV. Các giai đoạn OLGA/OLGIM III–IV được xem là nhóm nguy cơ cao ung thư dạ dày và cần được theo dõi nội soi định kỳ. Trong thực hành hiện nay, OLGIM được ưu tiên do độ lặp lại giữa các nhà giải phẫu bệnh cao hơn và khả năng dự báo nguy cơ ung thư dạ dày tốt hơn¹³,¹⁴. Cần phân loại bệnh nhân dựa trên tình trạng ổn định hoặc nghi ngờ biến chứng. Đối với các ca cấp cứu, nội soi nên được thực hiện sớm để xác định vị trí và mức độ chảy máu¹⁴."
      }
    ],
    "column1": [],
    "column2": [],
    "hasFigure": true,
    "figureData": {
      "id": "fig_3",
      "number": 3,
      "title": "Tỷ lệ loét dạ dày và loét tá tràng ở người sử dụng NSAID và người không sử dụng NSAID. aspirin.",
      "source": "Pilotto A FM. Upper Gastrointestinal Disorders. Hazzard's Geriatric Medicine and Gerontology, 8th edition, 2022. McGraw Hill¹",
      "imageSrc": "/demo-assets/id630/fig3.png"
    }
  },
  {
    "pageNumber": 5,
    "label": "Trang 5: Đánh giá trước điều trị & Xét nghiệm chẩn đoán",
    "blocks": [
      {
        "type": "heading",
        "content": "ĐÁNH GIÁ TRƯỚC ĐIỀU TRỊ:"
      },
      {
        "type": "paragraph",
        "content": "Nội soi đường tiêu hóa trên: luôn được chỉ định cho những đối tượng cao tuổi có các triệu chứng đau bụng mới xuất hiện vì tỷ lệ mắc các bệnh dạ dày nghiêm trọng ở nhóm tuổi này cao. Nội soi tiêu hóa trên là an toàn và dung nạp tốt ở người cao tuổi. Bằng cách nhận dạng trực quan, vị trí và kích thước của vết loét có thể được mô tả. Loét dạ dày tá tràng là một khiếm khuyết niêm mạc hình tròn đến hình bầu dục, đường kính từ 5 mm đến 4 cm, đáy nhẵn, bờ vuông góc. Một loạt mẫu sinh thiết để loại trừ khối u ác tính là bắt buộc ở cả vị trí trung tâm và rìa của vết loét dạ dày, ngay cả khi chúng không nhô cao hoặc không đều như ở dạng loét của ung thư dạ dày tiến triển. Sinh thiết dạ dày giúp xác định sự hiện diện và mức độ nghiêm trọng của viêm dạ dày mãn tính và/hoặc sự hiện diện của nhiễm H pylori. Sự lành tổn thương qua nội soi là tiêu chuẩn vàng để đánh giá thành công điều trị trong các thử nghiệm lâm sàng. Niêm mạc xung quanh có thể xuất hiện các nếp gấp hình tia, do hậu quả của sẹo vùng đỉnh¹."
      },
      {
        "type": "paragraph",
        "content": "Ở người cao tuổi bị viêm loét dạ dày tá tràng, chẩn đoán hình ảnh đóng vai trò quan trọng trong đánh giá căn nguyên và xử trí các biến chứng, đặc biệt khi bệnh diễn tiến nặng hoặc không đáp ứng với điều trị nội soi⁸. Chụp X quang dạ dày và tá tràng bằng barium được chỉ định như một phần đánh giá bước hai cho bệnh nhân nghi ngờ rối loạn vận động, hẹp môn vị hoặc rò trong đó gastrografin có thể được sử dụng thay thế cho barium trong các nghiên cứu tương phản. Chụp X quang bằng barium chống chỉ định khi có chảy máu, nôn mửa nặng, có nguy cơ hít sặc vào phổi cao hoặc trong trường hợp nghi ngờ thủng dạ dày hoặc tá tràng. Nếu vết loét thủng, không khí sẽ rò rỉ từ bên trong đường tiêu hóa vào khoang phúc mạc. Điều này dẫn đến “khí tự do” trong khoang phúc mạc có thể được quan sát thấy bên dưới cơ hoành khi chụp X-quang bụng thẳng hoặc nằm ngửa."
      },
      {
        "type": "paragraph",
        "content": "Trong bối cảnh xuất huyết tiêu hóa kháng trị, X-quang can thiệp đặc biệt là kỹ thuật tắc mạch qua đường ống thông, được xem là lựa chọn hiệu quả và an toàn thay thế phẫu thuật, với tỷ lệ tử vong và biến chứng tương đương. Ngoài ra, chẩn đoán hình ảnh mạch máu có vai trò then chốt trong phát hiện loét do thiếu máu cục bộ, thông qua đánh giá hẹp hoặc tắc các động mạch tạng và mạc treo, từ đó định hướng can thiệp tái thông mạch khi điều trị bảo tồn thất bại."
      },
      {
        "type": "paragraph",
        "content": " Các phương tiện hình ảnh cũng giúp nhận diện những nguyên nhân hiếm gặp liên quan đến thủ thuật can thiệp mạch hoặc xạ trị nội bộ, vốn có thể gây tổn thương loét do thiếu máu hoặc hoại tử niêm mạc. Trong các biến chứng phức tạp như thủng hoặc hẹp dạ dày tá tràng, chẩn đoán hình ảnh hỗ trợ đánh giá mức độ tổn thương và định hướng chiến lược điều trị, góp phần nâng cao hiệu quả quản lý bệnh loét ở nhóm bệnh nhân cao tuổi có nguy cơ cao⁸,⁹."
      },
      {
        "type": "subheading",
        "content": "CÁC XÉT NGHIỆM CHẨN ĐOÁN NHIỄM HELICOBACTER PYLORI (H PYLORI):"
      },
      {
        "type": "paragraph",
        "content": "Các phương pháp chẩn đoán Helicobacter pylori được chia thành xâm lấn và không xâm lấn. Các phương pháp xâm lấn bao gồm nội soi kết hợp mô bệnh học, test nhanh urê , nuôi cấy và PCR từ mẫu sinh thiết, trong đó mô bệnh học theo hệ thống Sydney cải tiến được xem là tiêu chuẩn vàng để đánh giá viêm dạ dày liên quan H. pylori³,¹⁰. Tuy nhiên, ở người cao tuổi, độ nhạy của test nhanh urê và mô bệnh học giảm do mật độ vi khuẩn thấp hoặc phân bố không đồng đều, đặc biệt trong bối cảnh viêm teo dạ dày mãn tính¹¹."
      },
      {
        "type": "paragraph",
        "content": "Nuôi cấy và PCR có vai trò quan trọng trong các trường hợp điều trị thất bại, đặc biệt để xác định tình trạng kháng kháng sinh³."
      },
      {
        "type": "paragraph",
        "content": "Trong nhóm phương pháp không xâm lấn, test thở urê được xem là tiêu chuẩn vàng với độ chính xác cao, trong khi xét nghiệm kháng nguyên phân là lựa chọn thay thế hiệu quả khi không thể thực hiện test thở urê, xét nghiệm huyết thanh chỉ có giá trị trong nghiên cứu dịch tễ do không phân biệt được nhiễm hiện tại hay đã nhiễm³,⁸,¹⁰. Để tránh kết quả âm tính giả, cần ngưng thuốc ức chế bơm proton, kháng sinh và bismuth trước khi xét nghiệm. Trong bối cảnh xuất huyết tiêu hóa, độ nhạy của hầu hết các phương pháp chẩn đoán giảm và PCR được xem là phương pháp nhạy nhất. Việc đánh giá hiệu quả diệt trừ H. pylori nên được thực hiện ít nhất 4 tuần sau điều trị bằng test thở urê hoặc xét nghiệm kháng nguyên phân đơn dòng¹⁰ (Bảng 1)."
      },
      {
        "type": "paragraph",
        "content": "Ngoài ra, vị trí sinh thiết cần được lựa chọn cẩn thận ở người cao tuổi, vì H. pylori có thể chỉ còn hiện diện ở thân vị hoặc phình vị mà không còn ở hang vị ở những bệnh nhân đang dùng thuốc kháng tiết. Tương tự, viêm teo dạ dày mãn tính do nhiễm H. pylori trong quá khứ có thể làm giảm tỷ lệ phát hiện vi khuẩn trong các mẫu sinh thiết dạ dày ở người cao tuổi so với bệnh nhân trẻ, góp phần làm giảm độ nhạy của test nhanh ure ở nhóm ≥ 65 tuổi¹."
      },
      {
        "type": "paragraph",
        "content": "Sự hiện diện và mức độ nghiêm trọng của viêm dạ dày đã được chứng minh về mặt mô học có thể được nghiên cứu thông qua việc đánh giá mô học về các thông số hình thái của niêm mạc dạ dày ở hai vị trí. Tất cả những phát hiện này cho thấy rằng ở người cao tuổi (1) nên thực hiện sinh thiết dạ dày từ cả hang vị và thân vị dạ dày và (2) nên thực hiện xét nghiệm H. pylori lần thứ hai ở nhóm tuổi này nếu xét nghiệm mô học hoặc dựa trên urê âm tính¹."
      }
    ],
    "column1": [],
    "column2": []
  },
  {
    "pageNumber": 6,
    "label": "Trang 6: Bảng 1 (Các xét nghiệm chẩn đoán H.pylori)",
    "blocks": [],
    "column1": [],
    "column2": [],
    "hasTable": true,
    "tableData": {
      "id": "table_1",
      "number": 1,
      "title": "Các xét nghiệm chẩn đoán nhiễm H.pylori¹",
      "source": "Pilotto A FM. Upper Gastrointestinal Disorders. Hazzard's Geriatric Medicine and Gerontology, 8th edition, 2022. McGraw Hill¹",
      "headers": [
        "Xét nghiệm",
        "Chẩn đoán",
        "Hạn chế"
      ],
      "rows": [
        {
          "cols": [
            "Mô học",
            "• Độ nhạy và độ đặc hiệu cao (95%–98%)\n• Cho biết sự hiện diện và độ nặng của viêm dạ dày do Hp ở các vị trí khác nhau của dạ dày",
            "• Xâm lấn (yêu cầu phải nội soi)\n• Độ nhạy giảm khi dùng PPI và khi đang bị chảy máu do loét\n• Kết quả khác nhau tùy người quan sát\n• Sự phân bố không đồng đều của Hp ở những vùng khác nhau của dạ dày"
          ]
        },
        {
          "cols": [
            "Test Urê nhanh",
            "• Nhanh (trong 1 giờ)\n• Độ nhạy và độ đặc hiệu cao (90%–95%)",
            "• Xâm lấn (yêu cầu phải nội soi)\n• Âm tính giả khi có tình trạng xuất huyết tiêu hóa trên cấp tính, dùng PPI, kháng sinh, Bismuth,..."
          ]
        },
        {
          "cols": [
            "Nuôi cấy",
            "• Độ đặc hiệu cao\n• Dùng test độ nhạy cảm với kháng sinh (kháng sinh đồ)",
            "• Xâm lấn (yêu cầu phải nội soi)\n• Kết quả có muộn (> 7 ngày)\n• Khó nuôi cấy (độ nhạy thấp)"
          ]
        },
        {
          "cols": [
            "Huyết thanh chẩn đoán",
            "• Dễ thực hiện\n• Tần suất nhiễm Hp ở địa phương ảnh hưởng đến giá trị tiên đoán dương của test kháng thể",
            "• Độ nhạy và độ đặc hiệu thấp (79%–85%)\n• Không chính xác ở người lớn tuổi\n• Không thể phân biệt hiện tại còn đang nhiễm hay đã từng nhiễm."
          ]
        },
        {
          "cols": [
            "Tìm kháng nguyên Hp trong phân",
            "• Không xâm lấn\n• Độ nhạy và độ đặc hiệu cao (94%–97%)\n• Cho biết tình trạng nhiễm Hp đang hoạt động\n• Hữu ích trong việc tầm soát sau triệt trừ Hp",
            "• Không phù hợp ở một số bệnh nhân\n• Tình trạng đang chảy máu sẽ làm giảm độ đặc hiệu (không làm giảm độ nhạy)"
          ]
        },
        {
          "cols": [
            "Test hơi thở ¹³C",
            "• Không xâm lấn\n• Độ nhạy và độ đặc hiệu cao (91%–92%)\n• Cho biết tình trạng nhiễm Hp đang hoạt động\n• Hữu ích trong việc tầm soát sau triệt trừ Hp",
            "• Âm tính giả khi có tình trạng xuất huyết tiêu hóa trên cấp tính, dùng PPI, kháng sinh, Bismuth,..."
          ]
        }
      ]
    }
  },
  {
    "pageNumber": 7,
    "label": "Trang 7: Chiến lược & Phác đồ điều trị",
    "blocks": [
      {
        "type": "subheading",
        "content": "Đánh giá sau khi tiệt trừ H pylori"
      },
      {
        "type": "paragraph",
        "content": "Việc tiệt trừ thành công phải luôn được xác nhận bằng xét nghiệm không xâm lấn hoặc xâm lấn nếu nội soi được chỉ định lâm sàng. Bệnh nhân cao tuổi được chẩn đoán loét tiêu hóa trên (đặc biệt là loét dạ dày), u MALT, ung thư hạch hoặc viêm dạ dày nặng nên được đánh giá bằng nội soi và mô học sau khi hoàn thành liệu pháp tiệt trừ H. pylori. Hầu hết các chuyên gia đều đồng ý rằng việc đánh giá này phải được thực hiện ít nhất 1 tháng sau khi hoàn thành điều trị để giảm thiểu kết quả âm tính giả. Bệnh nhân cao tuổi bị viêm dạ dày mãn tính nhẹ hoặc trung bình có thể được đánh giá sau khi điều trị bằng xét nghiệm không xâm lấn."
      },
      {
        "type": "paragraph",
        "content": "Xét nghiệm hơi thở ¹³C-urê cho thấy độ nhạy, độ đặc hiệu và độ chính xác chẩn đoán cao hơn so với huyết thanh học (kháng thể IgG kháng H. pylori) ở những đối tượng cao tuổi. Xét nghiệm tìm kháng nguyên H pylori trong phân (HpSA) để phát hiện H. pylori đã được đề xuất như một lựa chọn có giá trị với vai trò tiềm năng cao trong chẩn đoán sau khi điều trị tiệt trừ. Ở những bệnh nhân cao tuổi bị suy yếu nhập viện, HpSA kém chính xác hơn so với xét nghiệm hơi thở urê ¹³C¹."
      },
      {
        "type": "subheading",
        "content": "Các test không xâm lấn khác"
      },
      {
        "type": "paragraph",
        "content": "Nồng độ pepsinogen I và II trong huyết thanh (sPGI, sPGII), là dấu ấn sinh học của tình trạng viêm, sẽ gia tăng khi có viêm dạ dày không teo liên quan đến H pylori. Nồng độ sPGII cao hơn ở những người bị loét dạ dày và tá tràng và mức độ tương quan với mức độ nghiêm trọng của tình trạng viêm. Một nghiên cứu ở người cao tuổi cho thấy nồng độ sPGII giảm đáng kể sau khi điều trị thành công vi khuẩn H. pylori. Hơn nữa, sPGI hoặc tỷ lệ đo sPGI/sPGII có thể hữu ích để xác định tình trạng teo dạ dày ở vùng thân vị. Các xét nghiệm về gastrin (đặc biệt là gastrin-17) có thể là một chỉ số về tình trạng hình thái của niêm mạc hang vị¹¹."
      },
      {
        "type": "heading",
        "content": "ĐIỀU TRỊ:"
      },
      {
        "type": "paragraph",
        "content": "Chiến lược điều trị và tiệt trừ Helicobacter pylori ở người cao tuổi cần được cá thể hóa, dựa trên bệnh đồng mắc, nguy cơ tương tác thuốc và tình trạng kháng kháng sinh. Hiện nay, liệu pháp 4 thuốc có bismuth được xem là lựa chọn ưu tiên hàng đầu trong điều trị theo kinh nghiệm, đặc biệt tại các khu vực có tỷ lệ kháng clarithromycin cao, với thời gian điều trị 10–14 ngày³,⁸,⁹."
      },
      {
        "type": "paragraph",
        "content": "Liệu pháp sử dụng vonoprazan (P-CAB) kết hợp amoxicillin và clarithromycin cho thấy tỷ lệ diệt trừ >90%, tương đương hoặc vượt trội so với phác đồ PPI truyền thống, và là lựa chọn đầy hứa hẹn ở người cao tuổi²,¹⁰. Liệu pháp liều cao kép (amoxicillin liều cao phối hợp PPI mạnh hoặc vonoprazan) có ưu điểm đơn giản, ít tác dụng phụ và duy trì hiệu quả diệt trừ cao, đặc biệt phù hợp với bệnh nhân cao tuổi suy nhược²,¹⁰."
      },
      {
        "type": "paragraph",
        "content": "Mặc dù liệu pháp 3 thuốc dựa trên PPI (PPI, clarithromycin và amoxicillin hoặc nitroimidazole) từng được xem là điều trị chuẩn, hiệu quả của phác đồ này hiện giảm tại nhiều khu vực do tình trạng kháng thuốc gia tăng³,⁸,¹⁰. Tuy nhiên, các nghiên cứu ở người cao tuổi cho thấy liệu pháp 3 thuốc trong 7 ngày vẫn đạt hiệu quả và khả năng dung nạp tốt, với tỷ lệ tác dụng phụ thấp, việc sử dụng clarithromycin liều thấp (250 mg x 2 lần/ngày) cho hiệu quả tương đương liều chuẩn và dung nạp tốt hơn¹. Kéo dài thời gian điều trị lên 14 ngày hoặc áp dụng phác đồ nối tiếp 10 ngày có thể cải thiện tỷ lệ diệt trừ, dù dữ liệu chuyên biệt cho người cao tuổi còn hạn chế¹,¹²,¹³."
      },
      {
        "type": "paragraph",
        "content": "Ở những trường hợp thất bại điều trị, đặc biệt sau 2 phác đồ, điều trị dựa trên kháng sinh đồ (qua nuôi cấy hoặc kỹ thuật phân tử như PCR) được khuyến cáo để tối ưu hóa hiệu quả¹*. Việc bổ sung probiotic giúp giảm tác dụng phụ và cải thiện tuân thủ điều trị, trong khi giám sát chặt chẽ tương tác thuốc là cần thiết ở người cao tuổi²,⁸⁻¹⁰. Đánh giá kết quả diệt trừ H. pylori là bắt buộc và nên được thực hiện ít nhất 4 tuần sau khi kết thúc kháng sinh bằng test thở urê hoặc xét nghiệm kháng nguyên phân⁸."
      },
      {
        "type": "paragraph",
        "content": "ITT (The intention-to-treat): tỷ lệ tiệt trừ được phân tích theo ý định điều trị, PP (per-protocol): theo thiết kế nghiên cứu, PPI: thuốc ức chế bơm proton, C: Clarithromycin, M: Metronidazole, T: Tinidazole, A: Amoxicillin, TE: Tetracyclin, BS: Bismuth subcitrate."
      },
      {
        "type": "paragraph",
        "content": "Liều PPI: omeprazole 20mg x 2 lần/ngày, lansoprazole 30mg x 2 lần/ngày, pantoprazole 40mg x 2 lần/ngày, esomeprazole 40mg x 2 lần/ngày, rabeprazole 20mg x 2 lần/ngày."
      },
      {
        "type": "paragraph",
        "content": "Liều kháng sinh: Amoxicillin 1g x 2 lần/ngày, Clarithromycin 500 mg x 2 lần/ngày, Metronidazole 500mg x 2 lần/ngày (trong phác đồ 4 thuốc là 500mg x 3 lần/ngày), Tinidazole 500mg x 2 lần/ngày, Tetracyclin 500mg x 4 lần/ngày, Bismuth subcitrate 240mg x 4 lần/ngày. ** Dùng trong 5 ngày."
      },
      {
        "type": "paragraph",
        "content": "Tuân thủ kém và kháng kháng sinh là 2 lý do chính dẫn đến thất bại điều trị. Tình trạng kháng thuốc tiên phát với amoxicillin vẫn còn hiếm gặp nhưng tần suất kháng clarithromycin đã đạt tỷ lệ trên 70% ở một số"
      }
    ],
    "column1": [],
    "column2": []
  },
  {
    "pageNumber": 8,
    "label": "Trang 8: Bảng 2 (Thử nghiệm lâm sàng tiệt trừ H.pylori)",
    "blocks": [],
    "column1": [],
    "column2": [],
    "hasTable": true,
    "tableData": {
      "id": "table_2",
      "number": 2,
      "title": "Kết quả tích lũy của các thử nghiệm lâm sàng ngẫu nhiên có đối chứng về hiệu quả của các phác đồ tiệt trừ H pylori ở người cao tuổi¹",
      "source": "Pilotto A FM. Upper Gastrointestinal Disorders. Hazzard's Geriatric Medicine and Gerontology, 8th edition, 2022. McGraw Hill¹",
      "headers": [
        "Phác đồ",
        "Bệnh nhân (N)",
        "ITT (%)",
        "PP (%)",
        "Tác dụng phụ (%)"
      ],
      "rows": [
        {
          "isSubheader": true,
          "subheaderText": "Phác đồ bộ ba"
        },
        {
          "cols": [
            "PPI + C + M hoặc T",
            "296",
            "88",
            "91",
            "3.4"
          ]
        },
        {
          "cols": [
            "PPI + A* + C",
            "253",
            "84",
            "89",
            "7.1"
          ]
        },
        {
          "cols": [
            "PPI + A* + M",
            "154",
            "80",
            "84",
            "7.1"
          ]
        },
        {
          "cols": [
            "PPI + A* + C",
            "90",
            "80",
            "83",
            "12"
          ]
        },
        {
          "isSubheader": true,
          "subheaderText": "Phác đồ nối tiếp"
        },
        {
          "cols": [
            "PPI + A, PPI + C + T**",
            "89",
            "94",
            "97",
            "10"
          ]
        },
        {
          "isSubheader": true,
          "subheaderText": "Phác đồ 4 thuốc"
        },
        {
          "cols": [
            "PPI + TE + M + BS",
            "95",
            "91",
            "95",
            "28"
          ]
        }
      ]
    }
  },
  {
    "pageNumber": 9,
    "label": "Trang 9: Loét do NSAID & Thuốc chống đông",
    "blocks": [
      {
        "type": "paragraph",
        "content": "quốc gia trong đó có Trung Quốc, gần 50% ở Bồ Đào Nha và Iran và khoảng 16% ở Hoa Kỳ. Tỷ lệ kháng Metronidazole dao động từ 20% đến 30% và thường gặp hơn ở phụ nữ và các nước đang phát triển. Có sự đồng thuận trong việc sử dụng clarithromycin và metronidazole trong điều trị diệt trừ H pylori khi tỷ lệ kháng kháng sinh lần lượt thấp hơn 15% và 40%."
      },
      {
        "type": "paragraph",
        "content": "Vì thất bại điều trị thường liên quan đến tình trạng kháng kháng sinh thứ cấp nên việc tái điều trị lý tưởng nhất nên được hướng dẫn bởi dữ liệu về tính nhạy cảm với kháng sinh. Vì những thông tin như vậy thường không có sẵn nên việc lựa chọn phương pháp điều trị bậc hai phụ thuộc vào phương pháp điều trị nào được sử dụng ban đầu. Thật vậy, việc tiệt trừ H pylori khó khăn hơn khi lần điều trị đầu tiên thất bại và chiến lược điều trị tối ưu vẫn chưa được thiết lập ở những bệnh nhân cao tuổi. Vì vậy, nên giới thiệu chuyên khoa tiêu hóa trong tình huống này."
      },
      {
        "type": "subheading",
        "content": "Loét dạ dày tá tràng liên quan NSAID và Thuốc chống đông"
      },
      {
        "type": "paragraph",
        "content": "Việc quản lý thuốc chống viêm không steroid (NSAID) và thuốc chống đông ở người cao tuổi bị loét dạ dày tá tràng đòi hỏi sự cân bằng giữa nguy cơ xuất huyết tiêu hóa và nguy cơ huyết khối."
      },
      {
        "type": "subheading",
        "content": "Quản lý và điều trị khi có ổ loét do NSAID"
      },
      {
        "type": "paragraph",
        "content": "Khi phát hiện ổ loét dạ dày tá tràng, biện pháp ưu tiên hàng đầu là ngừng sử dụng NSAID, vì việc rút thuốc làm tăng đáng kể tỷ lệ lành loét. Trong trường hợp bệnh nhân vẫn cần điều trị chống viêm, có thể chuyển sang thuốc ức chế chọn lọc COX-2 (như celecoxib) do nguy cơ gây loét dạ dày tá tràng thấp hơn so với NSAID không chọn lọc. Nếu không thể ngừng NSAID, phối hợp thuốc ức chế bơm proton (PPI) là lựa chọn điều trị đầu tay, với hiệu quả chữa lành loét vượt trội so với thuốc đối kháng thụ thể H2 hoặc các dẫn xuất prostaglandin. Đối với loét liên quan aspirin liều thấp, khuyến cáo tiếp tục aspirin kết hợp PPI thay vì ngừng aspirin, nhằm giảm nguy cơ tử vong và các biến cố tim mạch do ngừng điều trị kháng kết tập tiểu cầu⁸,⁹."
      },
      {
        "type": "subheading",
        "content": "Quản lý thuốc chống đông và kháng kết tập tiểu cầu khi có xuất huyết"
      },
      {
        "type": "paragraph",
        "content": "Ở bệnh nhân loét dạ dày tá tràng có xuất huyết đang sử dụng thuốc kháng đông và kháng kết tập tiểu cầu, cần đánh giá cân bằng giữa nguy cơ tái chảy máu và nguy cơ huyết khối (như nhồi máu cơ tim hoặc đột quỵ), với sự phối hợp chặt chẽ giữa bác sĩ tiêu hóa và tim mạch. Đối với thuốc kháng kết tập tiểu cầu, khuyến cáo tiếp tục aspirin ở những bệnh nhân có nguy cơ huyết khối cao, trong khi có thể tạm ngừng các thuốc kháng kết tập tiểu cầu khác, trừ trường hợp nguy cơ huyết khối rất cao. Ở bệnh nhân đang dùng liệu pháp kháng kết tập tiểu cầu kép, nên duy trì aspirin đơn trị liệu. Đối với thuốc chống đông, warfarin nên được tạm ngừng để tiến hành cầm máu nội soi và được dùng lại sớm hoặc chuyển sang heparin sau khi đạt được cầm máu ổn định. Với thuốc chống đông đường uống trực tiếp (DOACs), khuyến cáo tái sử dụng sớm trong vòng 1–2 ngày sau khi xác nhận cầm máu nội soi thành công nhằm giảm nguy cơ biến cố huyết khối⁹."
      },
      {
        "type": "subheading",
        "content": "Điều trị thuốc"
      },
      {
        "type": "paragraph",
        "content": "Loét dạ dày liên quan đến NSAID hoặc aspirin thường lành sau 4 đến 8 tuần điều trị bằng PPI. Tỷ lệ chữa lành sẽ cao hơn nếu ngừng điều trị bằng NSAID hoặc aspirin. Hiện tại, không có sự đồng thuận về lợi ích lâm sàng của việc điều trị duy trì bằng thuốc kháng tiết acid ở những bệnh nhân đã ngừng điều trị bằng NSAID hoặc aspirin sau khi lành vết loét dạ dày tá tràng liên quan đến NSAID¹."
      },
      {
        "type": "subheading",
        "content": "Phòng ngừa"
      },
      {
        "type": "paragraph",
        "content": "Chiến lược dự phòng loét dạ dày tá tràng cần dựa trên phân tầng nguy cơ, trong đó các yếu tố chính bao gồm tuổi >60, tiền sử loét (đặc biệt loét có biến chứng xuất huyết) và sử dụng đồng thời nhiều thuốc làm tổn thương niêm mạc như NSAID, corticosteroid hoặc thuốc chống đông. Thuốc ức chế bơm proton được khuyến nghị dự phòng thường quy cho bệnh nhân cao tuổi đang sử dụng NSAID và là bắt buộc ở những trường hợp dùng liệu pháp kháng kết tập tiểu cầu kép (DAPT) hoặc phối hợp thuốc chống đông với NSAID/aspirin nhằm giảm nguy cơ xuất huyết tiêu hóa trên. Vonoprazan (P-CAB) cho thấy hiệu quả dự phòng tương đương PPI và có thể là lựa chọn thay thế trong dự phòng tái phát loét do NSAID hoặc aspirin liều thấp⁸⁻¹⁰. Ngoài ra, cần xét nghiệm và diệt trừ Helicobacter pylori trước khi khởi trị NSAID hoặc aspirin dài hạn để giảm nguy cơ loét và biến chứng chảy máu. Khi sử dụng PPI kéo dài ở người cao tuổi, cần lưu ý tương tác thuốc, đặc biệt giữa omeprazole và clopidogrel qua CYP2C19, cũng như giám sát các tác dụng không mong muốn như tăng nguy cơ gãy xương hông và nhiễm Clostridioides difficile²,³ (Hình 4)."
      },
      {
        "type": "heading",
        "content": "XÁC ĐỊNH BỆNH NHÂN CÓ NGUY CƠ CAO (ĐÁNH GIÁ ĐA CHIỀU):"
      },
      {
        "type": "paragraph",
        "content": "Các chiến lược hiện tại để giảm tái phát loét và/hoặc biến chứng được coi là hiệu quả về mặt chi phí ở những bệnh nhân có nguy cơ cao. Do đó, rất quan trọng khi xác định những bệnh nhân nào có nguy cơ cao bị loét dạ dày và các biến chứng của nó khi họ được điều trị bằng các thuốc gây tổn thương dạ dày. Tiền sử có các triệu chứng đường tiêu hóa trên, loét dạ dày tá tràng và/hoặc chảy máu, sự hiện diện của nhiều bệnh và các thuốc dùng đồng thời, đặc biệt là steroid đường uống, thuốc kháng tiểu cầu, liệu pháp chống"
      }
    ],
    "column1": [],
    "column2": []
  },
  {
    "pageNumber": 10,
    "label": "Trang 10: Hình 4 (Chiến lược phòng ngừa đa chiều)",
    "blocks": [
      {
        "type": "paragraph",
        "content": "huyết khối (như heparin trọng lượng phân tử thấp) và thuốc chống đông đường uống làm tăng nguy cơ loét dạ dày tá tràng liên quan đến NSAID và các biến chứng của nó. Hơn nữa, suy giảm chức năng và nhận thức, suy dinh dưỡng, bất động và các yếu tố xã hội, tức là các yếu tố chính quyết định tình trạng suy yếu đa chiều, có thể ảnh hưởng tiêu cực đến kết quả và diễn biến của loét dạ dày tá tràng và các biến chứng của loét. Vì vậy, đánh giá lão khoa toàn diện có thể hữu ích trong việc đánh giá nguy cơ đa chiều ở bệnh nhân cao tuổi¹."
      },
      {
        "type": "subheading",
        "content": "GIẢM LIỀU THUỐC VÀ SỬ DỤNG NSAID ÍT TÁC DỤNG PHỤ TRÊN ĐƯỜNG TIÊU HÓA"
      },
      {
        "type": "paragraph",
        "content": "Nguy cơ loét dạ dày tá tràng và các biến chứng của nó dường như liên quan trực tiếp đến liều NSAID hoặc coxib đã cho. Nguy cơ tổn thương đường tiêu hóa trên thấp hơn đã được báo cáo với các thuốc NSAID có thời gian bán hủy trong huyết tương ngắn so với những thuốc có thời gian bán hủy kéo dài. Hơn nữa, các công thức phóng thích chậm làm tăng nguy cơ biến chứng loét¹."
      },
      {
        "type": "subheading",
        "content": "KẾT HỢP ĐIỀU TRỊ VỚI CÁC THUỐC BẢO VỆ DẠ DÀY KHÁC"
      },
      {
        "type": "paragraph",
        "content": "Misoprostol và PPI có hiệu quả hơn thuốc chẹn thụ thể H2 trong việc ngăn ngừa tổn thương nghiêm trọng ở dạ dày và tá tràng. Tuy nhiên, dùng misoprostol với liều 200 µg x 4 lần/ngày có tác dụng phụ cao hơn, đặc biệt là tiêu chảy khi so với PPI. PPI rất hiệu quả trong việc ngăn ngừa tổn thương dạ dày tá tràng ở cả người cao tuổi sử dụng NSAID ngắn hạn và dài hạn. Tương tự, PPI ngăn ngừa hiệu quả loét dạ dày tá tràng và các biến chứng của loét ở bệnh nhân cao tuổi được điều trị bằng aspirin liều thấp, liệu pháp kháng kết tập tiểu cầu và không phụ thuộc vào sự hiện diện của nhiễm H pylori¹."
      },
      {
        "type": "subheading",
        "content": "Tiệt trừ vi khuẩn H pylori"
      },
      {
        "type": "paragraph",
        "content": "Sử dụng NSAID và nhiễm H pylori là những yếu tố nguy cơ độc lập gây ra loét dạ dày tá tràng và xuất huyết do loét dạ dày tá tràng ở người cao tuổi. Ở những bệnh nhân dương tính với H pylori đang bắt đầu điều trị lâu dài bằng NSAID, việc điều trị nhiễm H pylori làm giảm nguy cơ mắc bệnh loét dạ dày tá tràng trong 6 tháng. Tuy nhiên, ở những bệnh nhân cao tuổi có nguy cơ cao, việc sử dụng PPI đồng thời với NSAID làm giảm sự xuất hiện của tổn thương dạ dày tá tràng cấp tính và mãn tính liên quan đến NSAID hiệu quả hơn so với việc chỉ loại trừ nhiễm H pylori. Hơn nữa, sau khi tiệt trừ H.pylori, điều trị duy trì bằng PPI có hiệu quả trong việc ngăn ngừa chảy máu do loét ở bệnh nhân cao tuổi. Tất cả những phát hiện này cho thấy việc tiệt trừ H pylori có thể là một chiến lược hữu ích để ngăn ngừa loét dạ dày tá tràng liên quan đến NSAID. Do đó, tình trạng nhiễm H pylori nên được xét nghiệm và điều trị ở người cao tuổi được dự tính sẽ sử dụng NSAID kéo dài¹."
      }
    ],
    "column1": [],
    "column2": [],
    "hasFigure": true,
    "figureData": {
      "id": "fig_4",
      "number": 4,
      "title": "Các chiến lược phòng ngừa loét dạ dày tá tràng liên quan đến NSAID hoặc aspirin ở bệnh nhân cao tuổi¹",
      "source": "Pilotto A FM. Upper Gastrointestinal Disorders. Hazzard's Geriatric Medicine and Gerontology, 8th edition, 2022. McGraw Hill¹",
      "imageSrc": "/demo-assets/id630/fig4.png"
    }
  },
  {
    "pageNumber": 11,
    "label": "Trang 11: Loét vô căn & An toàn thuốc PPI",
    "blocks": [
      {
        "type": "paragraph",
        "content": "tràng trong 6 tháng. Tuy nhiên, ở những bệnh nhân cao tuổi có nguy cơ cao, việc sử dụng PPI đồng thời với NSAID làm giảm sự xuất hiện của tổn thương dạ dày tá tràng cấp tính và mãn tính liên quan đến NSAID hiệu quả hơn so với việc chỉ loại trừ nhiễm H pylori. Do đó, tình trạng nhiễm H pylori nên được xét nghiệm và điều trị ở người cao tuổi được dự tính sẽ sử dụng NSAID kéo dài¹."
      },
      {
        "type": "subheading",
        "content": "Chương trình tư vấn giáo dục"
      },
      {
        "type": "paragraph",
        "content": "Một chiến lược quan trọng trong việc ngăn ngừa các tác dụng phụ liên quan đến NSAID là ngừng điều trị NSAID. Thật vậy, các nghiên cứu từ Canada và Hoa Kỳ đã báo cáo ước tính có khoảng 37% đến hơn 50% đơn thuốc NSAID không cần thiết, nghĩa là không phù hợp, ở những bệnh nhân cao tuổi bị viêm xương khớp¹."
      },
      {
        "type": "subheading",
        "content": "Loét dạ dày tá tràng không do NSAID, không do H pylori"
      },
      {
        "type": "paragraph",
        "content": "Loét dạ dày tá tràng không liên quan đến NSAID và Helicobacter pylori, còn gọi là loét vô căn, đang ngày càng được ghi nhận nhiều hơn trong bối cảnh tỷ lệ nhiễm H. pylori giảm tại nhiều khu vực trên thế giới. Các nghiên cứu gần đây cho thấy loét vô căn hiện chiếm khoảng 12–30% tổng số trường hợp loét dạ dày tá tràng, với tỷ lệ cao hơn ở nhóm người cao tuổi⁸,⁹."
      },
      {
        "type": "paragraph",
        "content": "Về sinh bệnh học, loét vô căn là một thực thể đa yếu tố phức tạp, liên quan đến suy giảm hàng rào bảo vệ niêm mạc, giảm tưới máu vi mạch, tình trạng xơ vữa động mạch và các bệnh lý mạn tính đồng mắc thường gặp ở người cao tuổi. Đặc biệt, việc sử dụng các thuốc gây tổn thương niêm mạc tiềm ẩn khác ngoài NSAID và aspirin (như thuốc chống đông, corticosteroid, thuốc chống trầm cảm SSRI, hoặc bisphosphonate) cũng có thể đóng vai trò kích hoạt hoặc làm nặng thêm vết loét⁹."
      },
      {
        "type": "paragraph",
        "content": "Về mặt chẩn đoán, việc xác định loét vô căn đòi hỏi phải loại trừ triệt để nhiễm H. pylori (thường cần ít nhất hai phương pháp xét nghiệm có độ nhạy cao, bao gồm sinh thiết mô học và test thở urê, sau khi đã ngưng PPI và kháng sinh đủ thời gian) và khai thác cẩn thận tiền sử sử dụng NSAID/aspirin ẩn hoặc không kê đơn¹."
      },
      {
        "type": "paragraph",
        "content": "Về điều trị, liệu pháp kháng tiết acid vẫn là nền tảng trong xử trí loét vô căn. Thuốc ức chế bơm proton liều chuẩn được khuyến cáo sử dụng ít nhất 4 tuần đối với loét tá tràng và 8 tuần đối với loét dạ dày (Hình 5). Tuy nhiên, không có bằng chứng thuyết phục cho thấy việc kéo dài thời gian điều trị hoặc tăng liều PPI mang lại lợi ích bổ sung ở các trường hợp loét vô căn không biến chứng¹,⁹,¹³."
      },
      {
        "type": "paragraph",
        "content": "biến chứng¹,⁹,¹³. Ở người cao tuổi không đáp ứng với điều trị PPI tối ưu, cần xem xét các nguyên nhân tiềm ẩn như không tuân thủ thuốc, tăng tiết acid kháng trị, bệnh Crohn, hội chứng Zollinger-Ellison, hoặc tổn thương ác tính chưa được phát hiện; khi đó, chỉ định nội soi lại kèm sinh thiết bổ sung là cần thiết¹."
      },
      {
        "type": "subheading",
        "content": "An toàn thuốc và tác dụng phụ của PPI"
      },
      {
        "type": "paragraph",
        "content": "Việc sử dụng thuốc ức chế bơm proton kéo dài ở người cao tuổi cần được cân nhắc thận trọng giữa lợi ích và nguy cơ, do những thay đổi sinh lý liên quan đến lão hóa và nguy cơ tương tác thuốc cao. Tình trạng giảm toan dạ dày do PPI có thể làm thay đổi hệ vi sinh đường ruột, từ đó làm tăng nguy cơ nhiễm Clostridioides difficile và viêm phổi mắc phải tại cộng đồng²."
      },
      {
        "type": "paragraph",
        "content": "Môi trường dạ dày ít acid cũng làm giảm khả năng hấp thu các dưỡng chất thiết yếu như vitamin B12, sắt và magie, dẫn đến các hậu quả lâm sàng bao gồm thiếu máu và rối loạn thần kinh khi sử dụng kéo dài. Ngoài ra, việc dùng PPI kéo dài có liên quan đến tăng nguy cơ loãng xương và gãy xương hông ở người cao tuổi, có thể do giảm hấp thu canxi không hòa tan và ảnh hưởng đến chu chuyển xương²,³."
      },
      {
        "type": "paragraph",
        "content": "Đặc biệt, tương tác giữa omeprazole/esomeprazole và clopidogrel qua việc cạnh tranh ức chế enzym CYP2C19 có thể làm giảm hoạt tính chống kết tập tiểu cầu của clopidogrel, làm tăng nhẹ nguy cơ biến cố tim mạch; do đó pantoprazole là lựa chọn ưu tiên hơn khi cần phối hợp ở nhóm bệnh nhân này²."
      },
      {
        "type": "paragraph",
        "content": "Để tối ưu hóa an toàn điều trị, chiến lược giảm liều hoặc ngừng thuốc (deprescribing) nên được xem xét định kỳ khi chỉ định ban đầu đã được giải quyết, áp dụng liều thấp nhất có hiệu quả và hạn chế dùng kéo dài không có chỉ định rõ ràng¹,². Việc tầm soát và diệt trừ Helicobacter pylori cần được tiến hành ít nhất 4 tuần sau khi kết thúc kháng sinh và 2 tuần sau khi ngừng PPI, ưu tiên các phương pháp không xâm lấn như test thở urê hoặc xét nghiệm kháng nguyên phân đơn dòng sau 4–8 tuần¹³."
      }
    ],
    "column1": [],
    "column2": []
  },
  {
    "pageNumber": 12,
    "label": "Trang 12: Hình 5 (Thuật toán điều trị), Từ viết tắt & Xung đột",
    "blocks": [
      {
        "type": "paragraph",
        "content": "như test thở urê hoặc xét nghiệm kháng nguyên phân nhờ độ chính xác cao và hiệu quả trong phòng ngừa tái phát, đặc biệt là xuất huyết tiêu hóa trên. Về dự phòng lâu dài, những bệnh nhân có tiền sử biến chứng loét nhưng vẫn bắt buộc phải sử dụng NSAID hoặc thuốc chống đông cần được phối hợp PPI dự phòng liên tục. Ở người cao tuổi suy nhược, việc đơn giản hóa phác đồ điều trị và theo dõi sát sao tình trạng dinh dưỡng cũng như tương tác thuốc đóng vai trò then chốt nhằm nâng cao chất lượng cuộc sống và giảm tỷ lệ tái nhập viện¹."
      },
      {
        "type": "subheading",
        "content": "DANH MỤC CÁC TỪ VIẾT TẮT"
      },
      {
        "type": "paragraph",
        "content": "**ASA:** Acetylsalicylic acid (aspirin)"
      },
      {
        "type": "paragraph",
        "content": "**COX-1:** Cyclooxygenase-1"
      },
      {
        "type": "paragraph",
        "content": "**DAPT:** Dual Antiplatelet Therapy (Liệu pháp kháng kết tập tiểu cầu kép)"
      },
      {
        "type": "paragraph",
        "content": "**DOACs:** Direct Oral Anticoagulants (Thuốc chống đông đường uống trực tiếp)"
      },
      {
        "type": "paragraph",
        "content": "**HpSA:** Helicobacter pylori Stool Antigen (Kháng nguyên H. pylori trong phân)"
      },
      {
        "type": "paragraph",
        "content": "**ICU:** Intensive Care Unit (Khoa Hồi sức tích cực)"
      },
      {
        "type": "paragraph",
        "content": "**IgG:** Immunoglobulin G"
      },
      {
        "type": "paragraph",
        "content": "**ITT:** Intention-to-Treat (Phân tích theo ý định điều trị)"
      },
      {
        "type": "paragraph",
        "content": "**MALT:** Mucosa-Associated Lymphoid Tissue (U lympho mô lympho liên kết niêm mạc)"
      },
      {
        "type": "paragraph",
        "content": "**NSAID:** Non-Steroidal Anti-Inflammatory Drug (Thuốc chống viêm không steroid)"
      },
      {
        "type": "paragraph",
        "content": "**OR:** Odds ratio (tỉ số chênh)"
      },
      {
        "type": "paragraph",
        "content": "**OLGA:** Operative Link on Gastritis Assessment"
      },
      {
        "type": "paragraph",
        "content": "**OLGIM:** Operative Link on Gastric Intestinal Metaplasia"
      },
      {
        "type": "paragraph",
        "content": "**PGI/PGII:** Pepsinogen I/II"
      },
      {
        "type": "paragraph",
        "content": "**P-CAB:** Potassium-Competitive Acid Blocker (Thuốc chẹn acid cạnh tranh kali)"
      },
      {
        "type": "paragraph",
        "content": "**PP:** Per-Protocol (Phân tích theo đề cương)"
      },
      {
        "type": "paragraph",
        "content": "**PPI:** Proton Pump Inhibitor (Thuốc ức chế bơm proton)"
      },
      {
        "type": "heading",
        "content": "XUNG ĐỘT LỢI ÍCH:"
      },
      {
        "type": "paragraph",
        "content": "Các tác giả cam kết không có bất kỳ xung đột lợi ích nào liên quan đến nội dung và việc công bố bài báo này."
      }
    ],
    "column1": [],
    "column2": [],
    "hasFigure": true,
    "figureData": {
      "id": "fig_5",
      "number": 5,
      "title": "(A) Các phác đồ điều trị cho người cao tuổi để điều trị nhiễm H pylori, dự phòng loét do stress, bệnh loét dạ dày tá tràng và biến chứng của nó. (B) Các kế hoạch trị liệu cho người cao tuổi để điều trị và/hoặc ngăn ngừa tổn thương dạ dày tá tràng liên quan đến thuốc.",
      "source": "Pilotto A FM. Upper Gastrointestinal Disorders. Hazzard's Geriatric Medicine and Gerontology, 8th edition, 2022. McGraw Hill¹",
      "imageSrc": "/demo-assets/id630/fig5.png"
    }
  },
  {
    "pageNumber": 13,
    "label": "Trang 13: Đóng góp & 13 Tài liệu tham khảo",
    "blocks": [
      {
        "type": "heading",
        "content": "ĐÓNG GÓP CỦA CÁC TÁC GIẢ:"
      },
      {
        "type": "paragraph",
        "content": "**Tác giả Hà Vũ:** Lên ý tưởng nghiên cứu, tổng quan y văn, soạn thảo và hoàn thiện bản thảo bài báo."
      },
      {
        "type": "paragraph",
        "content": "**Tác giả Viên Vĩnh Phú:** Tham gia rà soát nội dung chuyên môn, chỉnh sửa và phê duyệt bản thảo cuối cùng."
      },
      {
        "type": "heading",
        "content": "TÀI LIỆU THAM KHẢO:"
      },
      {
        "type": "paragraph",
        "content": "1. Pilotto AF. Upper Gastrointestinal Disorders. Hazzard's Geriatric Medicine and Gerontology. 8th ed. New York: McGraw Hill; 2022."
      },
      {
        "type": "paragraph",
        "content": "2. Skokowski J, Vashin Y, Girnyi S, et al. The Aging Stomach: Clinical Implications of H. pylori Infection in Older Adults. 2024."
      },
      {
        "type": "paragraph",
        "content": "3. Artin MG, Sodano J, Rustgi SD, Aziz Z, Lim F, Yang JY, et al. Initial Diagnostic Strategies for Helicobacter Pylori in Patients With Bleeding Peptic Ulcers Undergoing Endoscopy: A Cost-Effectiveness Analysis. Gastro Hep Advances. 2024; 4(4). https://doi.org/10.1016/j.gastha.2024.100402"
      },
      {
        "type": "paragraph",
        "content": "4. Xie C, Liu Y, Qing X. Burden of gastrointestinal cancers in Asia, 1990–2019. BMC Gastroenterology. 2025;25(1):232. https://doi.org/10.1186/s12876-025-03824-z"
      },
      {
        "type": "paragraph",
        "content": "5. Gong H, Xu HM, Zhang DK. Focusing on Helicobacter pylori infection in the elderly. Front Cell Infect Microbiol. 2023. https://doi.org/10.3389/fcimb.2023.1121947"
      },
      {
        "type": "paragraph",
        "content": "6. Pilotto A. Helicobacter pylori-associated peptic ulcer disease in older patients: current management strategies. Drugs & aging. 2001;18(7):487-94."
      },
      {
        "type": "paragraph",
        "content": "7. Pilotto A, Franceschi M, Leandro G, Paris F, Cascavilla L, Longo MG, et al. Proton-pump inhibitors reduce the risk of uncomplicated peptic ulcer in elderly either acute or chronic users of NSAIDs. http://doi.org/10.2165/00002512-200118070-00002"
      },
      {
        "type": "paragraph",
        "content": "8. Malfertheiner P, Megraud F, Rokkas T, et al. Management of Helicobacter pylori infection: the Maastricht VI/Florence consensus report. Gut. 2022;71(9):1724–62."
      },
      {
        "type": "paragraph",
        "content": "9. Kamada T, Satoh K, Itoh T, Ito M, Iwamoto J, Okimoto T, et al. Evidence-based clinical practice guidelines for peptic ulcer disease 2020. Journal of Gastroenterology. 2021;56(4): 303–22. https://doi.org/10.1007/s00535-021-01769-0"
      },
      {
        "type": "paragraph",
        "content": "10. Gong H, Xu HM, Zhang D. Focusing on Helicobacter pylori infection in the elderly. Frontiers in Cellular and Infection Microbiology. 2023. https://doi.org/10.3389/fcimb.2023.1121947"
      },
      {
        "type": "paragraph",
        "content": "11. Tursi A, De Bastiani R, Franceschi M, et al. Non-invasive assessment of gastric secretory function in centenarians. 2017. https://doi.org/10.14081/jgc.2017.6482"
      },
      {
        "type": "paragraph",
        "content": "12. Bhala N, Emberson J, Merhi A, Abramson S, Arber N, Baron JA, et al. Vascular and upper gastrointestinal effects of non-steroidal anti-inflammatory drugs: meta-analyses of individual participant data from randomised trials. Lancet. 2013;382(9894):769–79. https://doi.org/10.1016/s0140-6736(13)60900-9"
      },
      {
        "type": "paragraph",
        "content": "13. Mishuk AU, Chen L, Gaillard P, Westrick S, Hansen RA, Qian J. National trends in prescription proton pump inhibitor use and expenditure in the United States in 2002–2017; 2020. https://doi.org/10.1016/j.japh.2020.09.015"
      }
    ],
    "column1": [],
    "column2": []
  }
];
